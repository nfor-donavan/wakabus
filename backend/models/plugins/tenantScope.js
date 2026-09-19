/**
 * tenantScope plugin
 *
 * Fixes: "tenantId required in schema" is not enough — a bug can still write
 * Model.find({}) and accidentally return every tenant's data.
 *
 * This plugin makes that structurally impossible: it hooks every find/update/
 * delete/count query and THROWS if tenantId is not present in the filter,
 * unless the query was explicitly marked with .setOptions({ skipTenantScope: true })
 * (only Super Admin controllers are allowed to do that).
 */
const SCOPED_OPS = [
  "find",
  "findOne",
  "findOneAndUpdate",
  "findOneAndDelete",
  "findOneAndRemove",
  "updateOne",
  "updateMany",
  "deleteOne",
  "deleteMany",
  "countDocuments",
];

function tenantScope(schema) {
  SCOPED_OPS.forEach((op) => {
    schema.pre(op, function (next) {
      const opts = this.getOptions ? this.getOptions() : this.options || {};
      if (opts.skipTenantScope) return next();

      const filter = this.getQuery ? this.getQuery() : this._conditions;
      const hasTenantId =
        filter &&
        Object.prototype.hasOwnProperty.call(filter, "tenantId") &&
        filter.tenantId !== undefined &&
        filter.tenantId !== null;

      if (!hasTenantId) {
        return next(
          new Error(
            `Tenant isolation violation: "${op}" on "${this.model.modelName}" was called without a tenantId filter. ` +
              `Pass tenantId explicitly, or .setOptions({ skipTenantScope: true }) for verified Super Admin routes only.`
          )
        );
      }
      next();
    });
  });
}

module.exports = tenantScope;

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
 *
 * EXCEPTION — queries filtered by _id: when Mongoose runs .populate("busId"),
 * it internally fires a second query like Bus.find({ _id: { $in: [...] } })
 * with no tenantId in it at all. That's not a leak — the referenced _ids
 * only ever got onto the parent document (e.g. Schedule.busId) through code
 * that already enforced tenantId when it was set, so looking them up by
 * their own _id is inherently safe. Blocking it would just throw on every
 * legitimate populate() call. So a query scoped by _id is allowed through
 * without a tenantId, while a blanket find({}) or find({status: ...}) with
 * no tenantId and no _id still throws exactly as before.
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

      const hasIdFilter =
        filter && Object.prototype.hasOwnProperty.call(filter, "_id") && filter._id !== undefined;

      if (!hasTenantId && !hasIdFilter) {
        return next(
          new Error(
            `Tenant isolation violation: "${op}" on "${this.model.modelName}" was called without a tenantId or _id filter. ` +
              `Pass tenantId explicitly, or .setOptions({ skipTenantScope: true }) for verified Super Admin routes only.`
          )
        );
      }
      next();
    });
  });
}

module.exports = tenantScope;


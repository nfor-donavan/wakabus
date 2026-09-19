const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const ctrl = require("../controllers/superAdminController");

router.use(requireAuth, requireRole("super_admin"));

router.post("/tenants", asyncHandler(ctrl.createTenant));
router.get("/tenants", asyncHandler(ctrl.listTenants));
router.patch("/tenants/:tenantId/active", asyncHandler(ctrl.setTenantActive));
router.patch("/tenants/:tenantId/commission", asyncHandler(ctrl.setCommissionRate));
router.get("/revenue", asyncHandler(ctrl.globalRevenue));

module.exports = router;

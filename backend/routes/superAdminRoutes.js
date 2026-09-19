const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/superAdminController");

router.use(requireAuth, requireRole("super_admin"));

router.post("/tenants", ctrl.createTenant);
router.get("/tenants", ctrl.listTenants);
router.patch("/tenants/:tenantId/active", ctrl.setTenantActive);
router.patch("/tenants/:tenantId/commission", ctrl.setCommissionRate);
router.get("/revenue", ctrl.globalRevenue);

module.exports = router;

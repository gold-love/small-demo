const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getProjects, createProject, updateProject, deleteProject,
    getVendors, createVendor, updateVendor, deleteVendor,
    getAssets, createAsset, updateAsset, deleteAsset,
    getOrgUsers, updateUserRole, deleteOrgUser
} = require('../controllers/enterpriseController');

const router = express.Router();

router.route('/projects').get(protect, getProjects).post(protect, createProject);
router.route('/projects/:id').put(protect, updateProject).delete(protect, deleteProject);

router.route('/vendors').get(protect, getVendors).post(protect, createVendor);
router.route('/vendors/:id').put(protect, updateVendor).delete(protect, deleteVendor);

router.route('/assets').get(protect, getAssets).post(protect, createAsset);
router.route('/assets/:id').put(protect, updateAsset).delete(protect, deleteAsset);

// User Management (Admin only)
router.route('/users').get(protect, getOrgUsers);
router.route('/users/:id/role').put(protect, updateUserRole);
router.route('/users/:id').delete(protect, deleteOrgUser);

module.exports = router;

const { Project, Vendor, Asset, User, Expense } = require('../models');
const { fn, col } = require('sequelize');

// Project Controllers
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.findAll({
            where: { organizationId: req.user.organizationId }
        });
        
        // Calculate spending for each project
        const projectsWithStats = await Promise.all(projects.map(async (project) => {
            const spent = await Expense.sum('amount', {
                where: { 
                    projectId: project.id,
                    status: 'approved'
                }
            }) || 0;
            
            return {
                ...project.toJSON(),
                totalSpent: spent,
                isOverBudget: project.budget ? parseFloat(spent) > parseFloat(project.budget) : false,
                usagePercentage: project.budget ? ((spent / project.budget) * 100).toFixed(1) : 0
            };
        }));

        res.json(projectsWithStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProject = async (req, res) => {
    try {
        const project = await Project.create({
            ...req.body,
            organizationId: req.user.organizationId
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            where: { id: req.params.id, organizationId: req.user.organizationId }
        });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        await project.update(req.body);
        res.json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            where: { id: req.params.id, organizationId: req.user.organizationId }
        });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        await project.destroy();
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Vendor Controllers
exports.getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.findAll({
            where: { organizationId: req.user.organizationId }
        });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createVendor = async (req, res) => {
    try {
        const vendor = await Vendor.create({
            ...req.body,
            organizationId: req.user.organizationId
        });
        res.status(201).json(vendor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({
            where: { id: req.params.id, organizationId: req.user.organizationId }
        });
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
        
        await vendor.update(req.body);
        res.json(vendor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({
            where: { id: req.params.id, organizationId: req.user.organizationId }
        });
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
        
        await vendor.destroy();
        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Asset Controllers
exports.getAssets = async (req, res) => {
    try {
        const assets = await Asset.findAll({
            where: { organizationId: req.user.organizationId },
            include: [{ model: User, attributes: ['name', 'email'] }]
        });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAsset = async (req, res) => {
    try {
        if (!req.user.organizationId) {
            return res.status(400).json({ 
                message: 'Your account is not associated with an organization. Please contact support or set up your organization settings.' 
            });
        }

        const asset = await Asset.create({
            ...req.body,
            organizationId: req.user.organizationId
        });
        res.status(201).json(asset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateAsset = async (req, res) => {
    try {
        const asset = await Asset.findOne({
            where: { id: req.params.id, organizationId: req.user.organizationId }
        });
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        
        await asset.update(req.body);
        res.json(asset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findOne({
            where: { id: req.params.id, organizationId: req.user.organizationId }
        });
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        
        await asset.destroy();
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// User Management Controllers (Admin Only)
exports.getOrgUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { organizationId: req.user.organizationId },
            attributes: ['id', 'name', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user || user.organizationId !== req.user.organizationId) {
            return res.status(404).json({ message: 'User not found in your organization' });
        }

        // Prevent self-demotion
        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot change your own role' });
        }

        user.role = role;
        await user.save();
        res.json({ message: `User role updated to ${role}`, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteOrgUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user || user.organizationId !== req.user.organizationId) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete yourself' });
        }
        await user.destroy();
        res.json({ message: 'User removed from organization' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

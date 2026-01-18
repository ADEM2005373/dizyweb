const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentCommerciaux.controller');
const auth = require('../middlewares/auth.middlewares');

router.post('/', auth.verifyToken, controller.createDocument);
router.get('/', auth.verifyToken, controller.getAllDocuments);
router.get('/:id', auth.verifyToken, controller.getDocumentById);
router.delete('/:id', auth.verifyToken, controller.deleteDocument);

router.put('/:id/proposal', auth.verifyToken, controller.agentSubmitProposal);
router.put('/:id/validate-standard', auth.verifyToken, controller.agentValidateStandard);
router.put('/:id/admin-approve', auth.verifyToken, controller.adminApproveProposal);
router.put('/:id/complete', auth.verifyToken, controller.markAsCompleted);

module.exports = router;

import { Router } from "express";
import { login, atualizarIptu, novoLogin, getIptuPorIdUsuario, getQRCodeOrCodBarras } from "../controllers/usuarioController";

const router = Router();

router.post("/login", login);
router.post("/novo-login", novoLogin);
router.post("/atualizar-iptu", atualizarIptu);
router.get("/iptu-por-usuario", getIptuPorIdUsuario);
router.get("/codigo-qr-ou-barra", getQRCodeOrCodBarras);

export default router;
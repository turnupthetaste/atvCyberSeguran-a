import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Comentario } from "./Tipos/Comentario";
import type { Iptuu } from "./Tipos/Iptuu";

// [SEGURANÇA] Endpoint movido para variável de ambiente para evitar
// HTTP hardcoded e permitir uso de HTTPS em produção. (mitigação 1.7)
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function Dashboard() {
  const navigate = useNavigate();

  // [SEGURANÇA - RISCO CONHECIDO] Dados do usuário lidos do localStorage.
  // O localStorage pode ser manipulado por qualquer script na página (XSS)
  // ou manualmente pelo usuário. A solução definitiva é usar tokens JWT
  // validados pelo servidor a cada requisição, sem depender de dados
  // enviados pelo cliente. (ponto de ataque 1.3 e 1.5 — mitigação parcial)
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [menuAberto, setMenuAberto] = useState(false);
  const [iptu, setIptu] = useState<Iptuu | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);

  useEffect(() => {
    // [SEGURANÇA] Guarda de rota: redireciona para /login se não houver
    // sessão iniciada no localStorage, impedindo acesso direto ao Dashboard
    // sem autenticação. (mitigação 1.6)
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const buscarDados = async () => {
      try {
        const response = await axios.post(
          `${API_URL}/usuario/iptu-por-usuario`,
          // [SEGURANÇA - RISCO CONHECIDO] O userId é enviado no corpo da
          // requisição a partir do localStorage, sem token de autenticação.
          // Isso permite que qualquer usuário altere o id e acesse dados de
          // outro munícipe (IDOR). A correção definitiva requer que o servidor
          // identifique o usuário via token JWT no header Authorization,
          // ignorando o userId enviado pelo cliente. (ponto de ataque 1.5)
          { userId: user.id }
        );

        setIptu(response.data);
      } catch (error) {
        console.error("Erro ao buscar IPTU", error);
      }
    };

    const buscarComentarios = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/comentario`
        );

        setComentarios(response.data);
      } catch (error) {
        console.error("Erro ao buscar comentários", error);
      }
    };

    buscarDados();
    buscarComentarios();
  }, [user?.id]);


  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>Bem-vindo, {user.nome}</h2>

        <div style={{ position: "relative" }}>
          <button onClick={() => setMenuAberto(!menuAberto)}>
            ☰ Menu
          </button>

          {menuAberto && (
            <div style={styles.dropdown}>
              <button onClick={() => alert("Listar Munícipes")}>
                Listar Munícipes
              </button>
              <button onClick={() => alert("Outra opção")}>
                Outra opção
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={styles.card}>
        <h3>IPTU</h3>
        {iptu && <p>Valor IPTU: {iptu.valor}</p>}
        {/* <p>Status: {iptu && iptu.pago ? "Pago ✅" : "Em aberto ❌"}</p> */}
        <p>Status: {iptu?.valor}</p>
      </div>

      <div style={{ padding: "40px" }}>
        <h2>Lista de Comentários</h2>

        <ul>
          {comentarios.map((comentario, index) => (
            <li key={index}>
              {/*
                [SEGURANÇA] dangerouslySetInnerHTML REMOVIDO e substituído
                por JSX puro. O bloco original injetava comentario.texto e
                comentario.usuario_id diretamente no DOM sem sanitização,
                permitindo XSS Armazenado — qualquer script salvo no banco
                seria executado no navegador de todos os usuários.
                O React escapa automaticamente o conteúdo renderizado como
                texto, eliminando esse vetor. (mitigação 1.4)

                CÓDIGO REMOVIDO:
                <div
                  dangerouslySetInnerHTML={{
                    __html: `
                      <strong>Usuário:</strong> ${comentario.usuario_id}
                      <br/>
                      <strong>Mensagem:</strong> ${comentario.texto}
                    `,
                  }}
                />
              */}
              <div>
                <strong>Usuário:</strong> {comentario.usuario_id}
                <br />
                <strong>Mensagem:</strong> {comentario.texto}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    fontFamily: "Arial",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: {
    marginTop: "40px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    width: "300px",
  },
  dropdown: {
    position: "absolute" as const,
    top: "40px",
    right: 0,
    background: "white",
    border: "1px solid #ccc",
    display: "flex",
    flexDirection: "column" as const,
    padding: "10px",
    gap: "5px",
  },
};

export default Dashboard;

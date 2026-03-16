import axios from "axios";
import { useEffect, useState } from "react";

import type { Comentario } from "./Tipos/Comentario";
import type { Iptuu } from "./Tipos/Iptuu";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [menuAberto, setMenuAberto] = useState(false);
  const [iptu, setIptu] = useState<Iptuu | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [tipoCodigo, setTipoCodigo] = useState("codigoDeBarras");
  const [htmlRetorno, setHtmlRetorno] = useState("");

  useEffect(() => {
    const buscarDados = async () => {
      try {

        const response = await axios.get<{ iptu: Iptuu[] }>(
          "http://localhost:3001/usuario/iptu-por-usuario?usuarioId=" + user.id
        );

        setIptu(response.data.iptu[0]);
      } catch (error) {
        console.error("Erro ao buscar IPTU", error);
      }
    };

    const buscarComentarios = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/comentario"
        );

        setComentarios(response.data);
      } catch (error) {
        console.error("Erro ao buscar comentários", error);
      }
    };
    if (user?.id) {
      buscarDados();
      buscarComentarios();
    }
  }, [user]);

  const enviarComentario = async () => {
    if (!novoComentario.trim()) return;

    try {
      await axios.post("http://localhost:3001/comentario", {
        usuarioId: user.id,
        texto: novoComentario,
      });

      // Atualiza lista após enviar
      const response = await axios.get("http://localhost:3001/comentario");
      setComentarios(response.data);

      setNovoComentario("");
    } catch (error) {
      console.error("Erro ao enviar comentário", error);
    }
  };
  const buscarCodigo = async () => {
    const response = await axios.get(
      "http://localhost:3001/usuario/codigo-qr-ou-barra?tipo=" + tipoCodigo
    );

    setHtmlRetorno(response.data);
  };

  // dados fictícios de IPTU


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
      <select
        value={tipoCodigo}
        onChange={(e) => setTipoCodigo(e.target.value)}
      >
        <option value="codigoDeBarras">Código de Barras</option>
        <option value="qrcode">QR Code</option>
      </select>

      <button onClick={buscarCodigo}>
        Gerar Código
      </button>
      {htmlRetorno && (
        <div
          dangerouslySetInnerHTML={{
            __html: htmlRetorno,
          }}
        />
      )}
      <div style={{ padding: "40px" }}>
        <h2>Lista de Comentários</h2>
        <div style={{ marginBottom: "20px" }}>
          <h3>Adicionar Comentário</h3>

          <textarea
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            placeholder="Digite seu comentário..."
            style={{
              width: "100%",
              height: "80px",
              padding: "10px",
              marginBottom: "10px",
            }}
          />

          <button onClick={enviarComentario}>
            Enviar Comentário
          </button>
        </div>
        <ul>
          {comentarios.map((comentario, index) => (
            <li key={index}>
              <div
                dangerouslySetInnerHTML={{
                  __html: `
                  <strong>Usuário:</strong> ${comentario.usuario_id}
                  <br/>
                  <strong>Mensagem:</strong> ${comentario.texto}
                `,
                }}
              />
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
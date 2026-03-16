import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// [SEGURANÇA] Endpoint movido para variável de ambiente para evitar
// HTTP hardcoded e permitir uso de HTTPS em produção (mitigação 1.7)
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function Login() {
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nome, setNome] = useState("");
    const [message, setMessage] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                `${API_URL}/usuario/login`,
                { email, password }
            );
            const user = response.data.user;

            // [SEGURANÇA - RISCO CONHECIDO] Dados do usuário armazenados no
            // localStorage são acessíveis por qualquer script JavaScript na página,
            // tornando-os vulneráveis a XSS. A correção definitiva é utilizar
            // cookies HttpOnly gerenciados pelo servidor, que não são acessíveis
            // via JavaScript. (ponto de ataque 1.3 — mitigação parcial)
            localStorage.setItem("user", JSON.stringify(user));

            navigate("/dashboard");
        } catch {
            setMessage("Erro no login");
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                `${API_URL}/usuario/novo-login`,
                { email, password, nome }
            );
            if (response.data.success) {
                setMessage("Usuário criado com sucesso!");
                setIsRegistering(false);
            }
        } catch {
            setMessage("Erro no cadastro");
        }
    };

    return (
        <div style={styles.container}>
            <h1>{isRegistering ? "Criar Conta" : "Login"}</h1>

            <form
                onSubmit={isRegistering ? handleRegister : handleLogin}
                style={styles.form}
            >
                {isRegistering && (
                    <input
                        type="text"
                        placeholder="Nome Completo"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        style={styles.input}
                        required
                    />
                )}

                {/*
                  [SEGURANÇA] type="email" adicionado para que o navegador
                  valide o formato antes de enviar ao servidor, dificultando
                  injeção de payloads arbitrários. maxLength={150} limita o
                  tamanho da entrada. (mitigação 1.2)
                */}
                <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    maxLength={150}
                    required
                />

                {/*
                  [SEGURANÇA] maxLength={64} adicionado para limitar o tamanho
                  do payload de senha, dificultando a injeção de scripts longos
                  via esse campo. (mitigação 1.1)
                  NOTA: a proteção definitiva contra SQL Injection deve ser feita
                  no back-end com prepared statements / ORM parametrizado.
                */}
                <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    maxLength={64}
                    required
                />

                <button type="submit" style={styles.button}>
                    {isRegistering ? "Cadastrar" : "Entrar"}
                </button>
            </form>

            <p style={{ marginTop: 10 }}>{message}</p>

            <button
                onClick={() => {
                    setMessage("");
                    setIsRegistering(!isRegistering);
                }}
                style={styles.linkButton}
            >
                {isRegistering
                    ? "Já tem conta? Fazer login"
                    : "Não tem conta? Criar uma"}
            </button>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "Arial",
    },
    form: {
        display: "flex",
        flexDirection: "column" as const,
        width: "320px",
    },
    input: {
        marginBottom: "10px",
        padding: "8px",
        fontSize: "16px",
    },
    button: {
        padding: "10px",
        fontSize: "16px",
        cursor: "pointer",
    },
    linkButton: {
        marginTop: "15px",
        background: "none",
        border: "none",
        color: "blue",
        cursor: "pointer",
        textDecoration: "underline",
    },
};

export default Login;

'use client';

// hooks do react
import React, { useState } from 'react';

// navegação do next
import Link from 'next/link';



export default function RecuperarSenhaPage() {

  // estado do email digitado
  const [email, setEmail] = useState('');

  // controla se já foi enviado
  const [isSent, setIsSent] = useState(false);

  // controla loading do botão
  const [isLoading, setIsLoading] = useState(false);



  /*
  ====================================
  FUNÇÃO PARA ENVIAR EMAIL PARA O BACK
  ====================================
  chama a rota:
  POST /api/recuperar-senha
  */
  const handleRecover = async (e: React.FormEvent) => {

    // evita reload da página
    e.preventDefault();

    // ativa loading
    setIsLoading(true);

    try {

      // chamada para o backend
      const response = await fetch(
        "/api/recuperar-senha",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          // envia email para API
          body: JSON.stringify({
            email
          })
        }
      );


      // resposta da API
      const data = await response.json();


      // se erro
      if (!response.ok) {

        alert(
          data.error || "Erro ao enviar"
        );

        setIsLoading(false);
        return;
      }


      // sucesso
      setIsSent(true);
      setIsLoading(false);


      // mostra link no console (apenas teste)
      console.log("LINK:", data.link);


    } catch (err) {

      setIsLoading(false);

      alert(
        "Erro ao conectar com servidor"
      );

    }

  };



  return (

    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">

      {/* fundo decorativo */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-50 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] opacity-60" />


      <div className="w-full max-w-md z-10">

        {/* logo + título */}
        <div className="text-center mb-10">

          <Link href="/">
            <img
              src="/logo_azul.png"
              alt="Mesa de Estudos"
              className="h-50 w-auto mx-auto mb-6"
            />
          </Link>

          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
            Recuperar Senha
          </h2>

          <p className="text-slate-500 mt-2 font-medium">
            {isSent
              ? "Verifique sua caixa de entrada."
              : "Enviaremos um link de acesso para seu e-mail."}
          </p>

        </div>



        {/* card */}
        <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-slate-100 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)]">


          {/* FORMULÁRIO */}
          {!isSent ? (

            <form
              onSubmit={handleRecover}
              className="space-y-6"
            >

              {/* campo email */}
              <div>

                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                  E-mail de cadastro
                </label>

                <input
                  required
                  type="email"

                  // valor do estado
                  value={email}

                  // atualiza estado
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }

                  placeholder="exemplo@email.com"

                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 focus:bg-white outline-none transition-all font-medium"
                />

              </div>


              {/* botão */}
              <button
                type="submit"
                disabled={isLoading}

                className={`w-full py-5 text-white font-black rounded-2xl shadow-xl transition-all duration-300
                ${isLoading
                    ? 'bg-slate-400'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 hover:scale-[1.02] shadow-cyan-200'
                  }`}
              >

                {isLoading
                  ? "ENVIANDO..."
                  : "ENVIAR LINK DE RECUPERAÇÃO"}

              </button>

            </form>

          ) : (

            // tela de sucesso
            <div className="text-center py-4">

              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ✓
              </div>

              <p className="text-slate-600 font-bold mb-6">
                Enviamos as instruções para <strong>{email}</strong>
              </p>

              <Link
                href="/login"
                className="block w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                VOLTAR AO LOGIN
              </Link>

            </div>

          )}


          {/* link voltar */}
          <div className="mt-8 pt-6 border-t border-slate-50 text-center">

            <Link
              href="/login"
              className="text-sm text-indigo-600 font-bold hover:underline"
            >
              Lembrei minha senha
            </Link>

          </div>

        </div>

      </div>

    </div>
  );

}
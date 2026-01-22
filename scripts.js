document.addEventListener("DOMContentLoaded", () => {

    let inputTexto = document.querySelector(".input-texto"); // seleciona o primeiro elemento com essa classe
    let outputTexto = document.querySelector(".traducao");
    let btnGravar = document.getElementById("btnGravar"); // seleciona elemento pelo id
    let selectIdioma = document.querySelector(".idioma");
    let ouvindo = false;
    let timerSilencio = null;
    const tempoSilencio = 1500; // 1.5 segundos de silêncio
    

    function escreverDevagar(texto, velocidade = 25) {
        outputTexto.value = "";
        let i = 0;

        const intervalo = setInterval(() => {
            outputTexto.value += texto.charAt(i);
            ajustarAlturaTraducao();
            i++;

            if (i >= texto.length) {
                clearInterval(intervalo);
            }
        }, velocidade);
    }
    function ajustarAlturaTraducao() {
        outputTexto.style.height = "auto"
        outputTexto.style.height = outputTexto.scrollHeight + "px";
    }
    selectIdioma.addEventListener("change", () => {
        selectIdioma.classList.add("animar-idioma");

        setTimeout(() => {
            selectIdioma.classList.remove("animar-idioma");
        }, 400);
    });


    let recognition = null;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Inicializar reconhecimento de voz apenas se disponível
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        recognition = new SpeechRecognition()
        recognition.lang = "pt-BR"
        // iOS não suporta bem continuous = true
        recognition.continuous = !isSafari
        recognition.interimResults = false
    }


    btnGravar.addEventListener("click", () => {
        if (!recognition) {
            alert("Reconhecimento de voz não suportado neste navegador");
            return;
        }
        if (!ouvindo) {
            ouvindo = true;
            btnGravar.textContent = "parar";
            recognition.start(); //começa a ouvir
        } else {
            ouvindo = false;
            recognition.stop(); //para de ouvir
            btnGravar.textContent = "ouvir";
        }
    });

    recognition.onstart = () => {
        console.log("microfone ativo...")
    };

    recognition.onerror = (event) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        ouvindo = false;
        btnGravar.textContent = "ouvir";
    };

    recognition.onresult = (event) => {
        const TextoFalado = event.results[0][0].transcript
        inputTexto.value = TextoFalado
    };

    recognition.onend = () => {
        if (ouvindo && !isSafari) {
            // Apenas reinifia em navegadores que suportam continuous
            try {
                recognition.start();
            } catch (err) {
                console.error("Erro ao reiniciar reconhecimento:", err);
                ouvindo = false;
            }
        } else {
            btnGravar.textContent = "ouvir";
            ouvindo = false;
            traduzir(); 
        }
    };

    async function pedirPermissaoMIc() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            console.log("Permissão para usar o microfone concedida.");
        } catch (err) {
            console.log("Permissão para usar o microfone negada:", err);
        }

    }

    async function traduzir(texto = null) {
        const textoParaTraduzir = texto || inputTexto.value.trim();
        if (!inputTexto.value.trim()) return;

        const idiomaDestino = selectIdioma.value;

        try {
            let endereco = "https://api.mymemory.translated.net/get?q="
                + encodeURIComponent(textoParaTraduzir)
                + "&langpair=pt|" + idiomaDestino;

            let resposta = await fetch(endereco, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status}`);
            }
            
            let dados = await resposta.json();

            if (!dados.responseData || !dados.responseData.translatedText) {
                throw new Error("Resposta inválida da API");
            }

            escreverDevagar(dados.responseData.translatedText);
            ajustarAlturaTraducao();
            falar(dados.responseData.translatedText, idiomaDestino);

        } catch (err) {
            console.error("Erro na tradução:", err);
            outputTexto.value = "Erro ao traduzir. Verifique sua conexão.";
        }
    }
    // --------- TEXT TO SPEECH ---------
    function falar(texto, idioma = "en") {
        const mapLang = {
            "zh-CN": "zh-CN",
            en: "en-US",
            de: "de-DE",
            es: "es-ES",
            it: "it-IT",
            fr: "fr-FR",
        };

        speechSynthesis.cancel(); // Cancela qualquer fala em andamento

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = mapLang[idioma] || "en-US";
        speechSynthesis.speak(utterance)
    }
    // Permite chamar pelo onclick do botão
    window.traduzir = traduzir;
});

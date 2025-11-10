document.addEventListener('DOMContentLoaded', () => {

    const firebaseConfig = {
      apiKey: "AIzaSyBCAzuRmDTH6IZwgg73bEGUj1I-hNGMCYE",
      authDomain: "clicknet-9a4cd.firebaseapp.com",
      projectId: "clicknet-9a4cd",
      storageBucket: "clicknet-9a4cd.appspot.com",
      messagingSenderId: "756016012301",
      appId: "1:756016012301:web:bc878607facd4aeaa30944"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const form = document.getElementById('cadastro-form');
    const inputs = {
        nome: document.getElementById('nome'), apelido: document.getElementById('apelido'), cpf: document.getElementById('cpf'),
        nascimento: document.getElementById('nascimento'), estadoCivil: document.getElementById('estadoCivil'), bairro: document.getElementById('bairro'),
        rua: document.getElementById('rua'), numeroCasa: document.getElementById('numeroCasa'), pontoReferencia: document.getElementById('pontoReferencia'),
        celular: document.getElementById('celular'), email: document.getElementById('email'), plano: document.getElementById('plano'),
        dataPagamento: document.getElementById('dataPagamento'), indicacao: document.getElementById('indicacao'),
        fotoFrente: document.getElementById('fotoFrente'), fotoVerso: document.getElementById('fotoVerso'),
    };
    const btnSalvar = document.getElementById('btn-salvar');
    const btnLimpar = document.getElementById('btn-limpar');
    const listaClientesContainer = document.getElementById('lista-clientes-container');
    const inputBusca = document.getElementById('input-busca');
    const selectOrdenacao = document.getElementById('select-ordenacao');
    const imageModal = document.getElementById('image-modal');
    const modalImagePreview = document.getElementById('modal-image-preview');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const toast = document.getElementById('toast-notification');
    
    // Novos elementos
    const splashScreen = document.getElementById('splash-screen');
    const consentModal = document.getElementById('consent-modal');
    const openConsentModalLink = document.getElementById('open-consent-modal');
    const consentModalText = document.getElementById('consent-modal-text');
    const btnConfirmarTermo = document.getElementById('btn-confirmar-termo');
    const consentCheckbox = document.getElementById('consent-checkbox');
    const signatureCanvas = document.getElementById('signature-pad');
    const clearSignatureBtn = document.getElementById('clear-signature');
    const signaturePad = new SignaturePad(signatureCanvas);
    
    let clientes = [];
    let clientesExibidos = [];

    // --- LÓGICA DA SPLASH SCREEN ---
    window.addEventListener('load', () => {
        setTimeout(() => {
            splashScreen.classList.add('hidden');
        }, 1000); // 1 segundo
        resizeCanvas(); // Chama o redimensionamento do canvas
    });
    
    // --- FUNÇÕES DE PERSISTÊNCIA E UI ---
    const carregarClientes = () => { clientes = JSON.parse(localStorage.getItem('clientes') || '[]'); ordenarEFiltrarClientes(); };
    const salvarClientes = () => localStorage.setItem('clientes', JSON.stringify(clientes));
    const showToast = (message, isError = false) => { toast.textContent = message; toast.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--success-color)'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 5000); };
    const showImageModal = (base64) => { modalImagePreview.src = base64; imageModal.classList.add('visible'); };
    const hideImageModal = () => imageModal.classList.remove('visible');
    const setSavingState = (isSaving) => { btnSalvar.disabled = isSaving; btnSalvar.classList.toggle('loading', isSaving); };

    // --- REGRAS DE VALIDAÇÃO (Estado Civil opcional) ---
    const regrasValidacao = {
        nome: { required: true, pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, message: 'Apenas letras, acentos e hífens.' },
        apelido: { pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, message: 'Apenas letras, acentos e hífens.' },
        cpf: { required: true, minLength: 14, message: 'CPF inválido.' },
        nascimento: { required: true, minLength: 10, message: 'Data inválida.' },
        estadoCivil: { pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, message: 'Apenas letras, acentos e hífens.' },
        bairro: { required: true, pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s'.,-]+$/, message: 'Caracteres inválidos.' },
        rua: { required: true, pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s'.,-]+$/, message: 'Caracteres inválidos.' },
        numeroCasa: { pattern: /^\d*$/, message: 'Apenas números.' },
        pontoReferencia: { required: true, pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s'.,-]+$/, message: 'Caracteres inválidos.' },
        celular: { required: true, minLength: 15, message: 'Celular inválido.' },
        email: { pattern: /^\S+@\S+\.\S+$/, message: 'E-mail inválido.' },
        plano: { required: true },
        dataPagamento: { required: true, pattern: /^\d+$/, message: 'Apenas números.' },
        indicacao: { pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, message: 'Apenas letras, acentos e hífens.' }
    };

    const validarCampo = (inputId) => {
        const input = inputs[inputId];
        const rule = regrasValidacao[inputId];
        const errorMessageElement = input.closest('.field-group')?.querySelector('.error-message');
        let isValid = true;
        let errorMessage = '';
        if (!rule) return true;
        const value = input.value.trim();
        if (rule.required && !value) { isValid = false; errorMessage = 'Campo obrigatório.'; } 
        else if (value) {
            if (rule.minLength && value.length < rule.minLength) isValid = false;
            if (rule.pattern && !rule.pattern.test(value)) isValid = false;
            if(!isValid) errorMessage = rule.message || 'Formato inválido.';
        }
        input.classList.toggle('invalid', !isValid);
        if (errorMessageElement) errorMessageElement.textContent = errorMessage;
        return isValid;
    };
    
    // --- VALIDAÇÃO DE FORMULÁRIO (Atualizada para Termos e Assinatura) ---
    const validarFormulario = () => {
        const camposValidos = Object.keys(regrasValidacao).every(id => validarCampo(id));
        
        if (!consentCheckbox.checked) {
            showToast('É necessário ler e aceitar o Termo de Consentimento.', true);
            return false;
        }
        
        if (signaturePad.isEmpty()) {
            showToast('A assinatura é obrigatória.', true);
            return false;
        }

        return camposValidos;
    };
    
    // --- BUSCA E ORDENAÇÃO ---
    const ordenarEFiltrarClientes = () => {
        let processados = [...clientes];
        const termoBusca = inputBusca.value.toLowerCase();
        if (termoBusca) {
            processados = processados.filter(c => c.nome.toLowerCase().includes(termoBusca) || c.cpf.includes(termoBusca));
        }
        processados.sort((a, b) => {
            const tipo = selectOrdenacao.value;
            if (tipo === 'nome-asc') return a.nome.localeCompare(b.nome);
            if (tipo === 'nome-desc') return b.nome.localeCompare(a.nome);
            if (tipo === 'data-asc') return new Date(a.timestamp) - new Date(b.timestamp);
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        clientesExibidos = processados;
        renderizarLista();
    };
    
    // --- RENDERIZAÇÃO DA LISTA ---
    const renderizarLista = () => {
        listaClientesContainer.innerHTML = '';
        if (clientesExibidos.length === 0) {
            listaClientesContainer.innerHTML = '<p>Nenhum cliente encontrado.</p>';
            return;
        }
        clientesExibidos.forEach((cliente) => {
            const card = document.createElement('div');
            card.className = 'cliente-card';
            const temImagem = cliente.fotoFrenteBase64 || cliente.fotoVersoBase64;
            const nomeHtml = `<h3>${cliente.nome} ${temImagem ? `<i class="bi bi-image-alt icon-imagem-anexada" title="Ver imagem"></i>` : ''}</h3>`;
            card.innerHTML = `<div class="cliente-info">${nomeHtml}<p>${cliente.plano}</p></div><div class="cliente-actions"><button class="btn-pdf"><i class="bi bi-file-earmark-pdf-fill"></i> PDF</button><button class="btn-excluir"><i class="bi bi-x-circle-fill"></i> Excluir</button></div>`;
            card.querySelector('.btn-pdf').addEventListener('click', () => gerarPDF(cliente));
            card.querySelector('.btn-excluir').addEventListener('click', () => excluirCliente(cliente));
            if(temImagem) card.querySelector('.icon-imagem-anexada').addEventListener('click', () => showImageModal(cliente.fotoFrenteBase64 || cliente.fotoVersoBase64));
            listaClientesContainer.appendChild(card);
        });
    };

    const getImageDimensions = (base64) => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve({ width: img.width, height: img.height }); img.onerror = reject; img.src = base64; });
    
    // =================================================================================
    // FUNÇÃO GERAR PDF - ATUALIZADA (4 PÁGINAS)
    // =================================================================================
    const gerarPDF = async (cliente) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        const maxWidth = pageWidth - margin * 2;

        // --- PÁGINA 1: DADOS DO CADASTRO ---
        doc.setFont('Poppins', 'bold');
        doc.setFontSize(18);
        doc.text('Ficha Contratual ClickNet', pageWidth / 2, 22, { align: 'center' });
        doc.setFont('Poppins', 'normal');
        const tableData = [
            ['Nome Completo', cliente.nome], ['CPF', cliente.cpf], ['Data de Nascimento', cliente.nascimento], 
            ['Estado Civil', cliente.estadoCivil || 'Não informado'], 
            ['Endereço', `${cliente.rua}, ${cliente.numeroCasa || 'S/N'} - ${cliente.bairro}`], 
            ['Ponto de Referência', cliente.pontoReferencia], ['Nº de Celular', cliente.celular], 
            ['Plano', cliente.plano], ['Data de Pagamento', `Dia ${cliente.dataPagamento}`]
        ];
        if (cliente.apelido) tableData.splice(1, 0, ['Apelido', cliente.apelido]);
        if (cliente.email) tableData.push(['E-mail', cliente.email]);
        if (cliente.indicacao) tableData.push(['Indicação', cliente.indicacao]);
        
        doc.autoTable({
            startY: 30, head: [['Campo', 'Valor']], body: tableData, theme: 'striped',
            headStyles: { fillColor: [255, 193, 7], textColor: 255, fontStyle: 'bold', font: 'Poppins', fontSize: 12 },
            bodyStyles: { font: 'Poppins', fontSize: 12, cellPadding: 3.5 },
            margin: { left: margin, right: margin }
        });

        // --- PÁGINA 2: TERMOS E CONDIÇÕES ---
        doc.addPage();
        let finalY_pg2 = 20;

        doc.setFont('Poppins', 'bold');
        doc.setFontSize(14);
        doc.text('TERMO DE CIÊNCIA E CONSENTIMENTO – CLICKNET', pageWidth / 2, finalY_pg2, { align: 'center' });
        finalY_pg2 += 10;
        
        doc.setFont('Poppins', 'normal');
        doc.setFontSize(10);
        
        let intro = "Eu, abaixo assinado(a), Declaro que li, compreendi e aceito as condições abaixo, em conformidade com o Código Civil (Lei nº 10.406/2002), o Código de Defesa do Consumidor (Lei nº 8.078/1990) e a regulamentação da ANATEL aplicável (incluindo Resolução nº 765/2023 e atos correlatos).";
        let lines = doc.splitTextToSize(intro, maxWidth);
        doc.text(lines, margin, finalY_pg2);
        finalY_pg2 += (lines.length * 5) + 5;

        const termos = [
            { title: "1. Pagamentos e prazos", items: [
                "1.1 Declaro que devo manter minhas faturas em dia.",
                "1.2 Declaro estar ciente de que, em caso de atraso, a ClickNet me notificará por meio indicado no contrato (por exemplo, e-mail, SMS ou telefone), e que a suspensão parcial do serviço poderá ocorrer após 10 (dez) dias contados da data de recebimento da notificação, observadas as normas aplicáveis.",
                "1.3 Declaro que a persistência do débito por prazo superior poderá acarretar rescisão contratual e recolhimento do equipamento pela ClickNet, observados os prazos e procedimentos previstos neste Termo e na regulamentação aplicável.",
                "1.4 Declaro que eventuais encargos por atraso serão aplicados nos termos da legislação vigente, sem indicação de percentuais fixos neste Termo, observando-se o direito à informação clara sobre quaisquer encargos no contrato de prestação de serviço."
            ]},
            { title: "2. Condições gerais", items: [
                "2.1 Declaro que fui informado(a)(o) de que o plano contratado é, quando assim indicado na oferta, sem contrato de fidelidade anual, podendo ser cancelado conforme as condições contratuais.",
                "2.2 Declaro que fui informado(a)(o) de que a ClickNet poderá, a seu critério comercial, não cobrar juros por atraso; caso a cobrança de encargos seja aplicada, estes serão comunicados de forma clara e estarão sujeitos à legislação aplicável.",
                "2.3 Autorizo expressamente o eventual adiantamento da primeira parcela quando o serviço for contratado para imóvel alugado, desde que tal exigência tenha sido previamente informada por escrito e eu a tenha aceitado no momento da contratação."
            ]},
            { title: "3. Mudança de endereço", items: [
                "3.1 Declaro que a solicitação de mudança de endereço poderá estar condicionada a um prazo mínimo de utilização de 90 (noventa) dias a contar da instalação, quando essa condição for aplicável e previamente informada no contrato.",
                "3.2 Declaro que, caso solicite mudança antes do referido prazo, concordo com a possível cobrança da taxa administrativa de R$ 89,90 (oitenta e nove reais e noventa centavos), desde que esse valor e sua justificativa tenham sido previamente informados no contrato/termo de adesão.",
                "3.3 Declaro que a efetivação da mudança depende de disponibilidade técnica no novo endereço."
            ]},
            { title: "4. Desbloqueio temporário (“em confiança”)", items: [
                "4.1 Declaro que fui informado(a)(o) de que a ClickNet poderá, a seu critério, conceder desbloqueio provisório do serviço “em confiança” por até 3 (três) dias para permitir eventual regularização de pagamento.",
                "4.2 Declaro que, se o débito não for quitado dentro do período concedido, serão aplicadas as medidas previstas nas cláusulas de inadimplemento (suspensão, rescisão e recolhimento do equipamento), e que eventual cobrança referente ao período concedido será previamente informada."
            ]},
            { title: "5. Instalação e equipamentos (comodato)", items: [
                "5.1 Declaro que fui informado(a)(o) de que a instalação do serviço é gratuita, quando assim prevista na oferta.",
                "5.2 Declaro que os equipamentos fornecidos (modem, roteador, ONU, etc.) são disponibilizados em regime de comodato e permanecem de propriedade da ClickNet enquanto o plano estiver ativo, nos termos do Código Civil.",
                "5.3 Declaro que, em caso de cancelamento, a ClickNet realizará o recolhimento dos equipamentos sem custo para mim, em local por mim indicado, em prazo acordado que não poderá exceder 30 (trinta) dias contados da solicitação de desativação; se a ClickNet não recolher no prazo, cessará a minha responsabilidade pela guarda dos equipamentos."
            ]},
            { title: "6. Declarações finais e comunicações", items: [
                "6.1 Declaro que todas as informações relevantes sobre encargos, prazos, taxas e procedimentos me foram previamente informadas e estão disponíveis no contrato e nas Regras Básicas da ClickNet.",
                "6.2 Declaro que autorizo a ClickNet a me comunicar por e-mail, SMS, aplicativo ou telefone para fins de gestão contratual, cobrança e informações sobre o serviço, nos termos do contrato.",
                "6.3 Declaro que recebi orientação de que este Termo foi elaborado com base no Código Civil, no Código de Defesa do Consumidor e na regulamentação da ANATEL aplicável (incluindo Resolução nº 765/2023), e que a ClickNet poderá atualizar procedimentos conforme alterações regulatórias, comunicando-me quando necessário."
            ]}
        ];

        doc.setFontSize(9);
        termos.forEach(termo => {
            doc.setFont('Poppins', 'bold');
            lines = doc.splitTextToSize(termo.title, maxWidth);
            doc.text(lines, margin, finalY_pg2);
            finalY_pg2 += (lines.length * 4) + 2;
            
            doc.setFont('Poppins', 'normal');
            termo.items.forEach(item => {
                lines = doc.splitTextToSize(item, maxWidth);
                doc.text(lines, margin, finalY_pg2);
                finalY_pg2 += (lines.length * 4) + 2;
            });
            finalY_pg2 += 4;
        });

        // --- PÁGINA 3: ASSINATURA ---
        doc.addPage();
        let finalY_pg3 = 20;

        doc.setFont('Poppins', 'bold');
        doc.setFontSize(16);
        doc.text("Assinatura de Consentimento do Cliente", pageWidth / 2, finalY_pg3, { align: 'center' });
        finalY_pg3 += 20;

        if (cliente.fotoAssinatura) {
            try {
                const dims = await getImageDimensions(cliente.fotoAssinatura);
                const sigWidth = 120; // Assinatura maior
                const sigHeight = (dims.height * sigWidth) / dims.width;
                const sigX = (pageWidth - sigWidth) / 2; // Centralizada
                let sigY = finalY_pg3 + 20;
                
                doc.addImage(cliente.fotoAssinatura, 'PNG', sigX, sigY, sigWidth, sigHeight);
                sigY += sigHeight + 5;
                
                doc.setLineWidth(0.5);
                doc.line(sigX - 10, sigY, sigX + sigWidth + 10, sigY);
                doc.setFont('Poppins', 'normal');
                doc.setFontSize(12);
                doc.text("Assinatura do Cliente", pageWidth / 2, sigY + 8, { align: 'center' });
            } catch (e) { console.error("Erro ao adicionar assinatura:", e); }
        }

        // --- PÁGINA 4: DOCUMENTOS ---
        if (cliente.fotoFrenteBase64 || cliente.fotoVersoBase64) {
            doc.addPage();
            let currentY = 20;
            const addImageToPdf = async (base64, title) => {
                if (!base64) return;
                try {
                    const dims = await getImageDimensions(base64);
                    const aspectRatio = dims.width / dims.height;
                    let imgWidth = maxWidth;
                    let imgHeight = imgWidth / aspectRatio;
                    const maxHeight = 120;
                    if(imgHeight > maxHeight) { imgHeight = maxHeight; imgWidth = imgHeight * aspectRatio; }
                    doc.setFont('Poppins', 'bold'); doc.setFontSize(14); doc.text(title, margin, currentY);
                    doc.addImage(base64, 'JPEG', margin, currentY + 5, imgWidth, imgHeight);
                    currentY += imgHeight + 20;
                } catch (e) { console.error("Erro ao adicionar imagem ao PDF:", e); }
            };
            await addImageToPdf(cliente.fotoFrenteBase64, 'Documento - Frente');
            await addImageToPdf(cliente.fotoVersoBase64, 'Documento - Verso');
        }
        
        doc.save(`contrato_${cliente.nome.replace(/\s/g, '_')}.pdf`);
    };

    // --- LÓGICA DE CRUD (COM COMPRESSÃO E ASSINATURA) ---
    const compressAndEncodeImage = (file) => new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const MAX_WIDTH = 1024;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = () => reject(new Error("Não foi possível carregar a imagem. O formato pode ser incompatível (ex: HEIC)."));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
        reader.readAsDataURL(file);
    });

    const limparFormulario = () => {
        form.reset();
        signaturePad.clear();
        consentCheckbox.checked = false;
        document.getElementById('fotoFrente-filename').textContent = 'Nenhum arquivo selecionado';
        document.getElementById('fotoVerso-filename').textContent = 'Nenhum arquivo selecionado';
        Object.values(inputs).forEach(input => {
            input.classList.remove('invalid');
            const fieldGroup = input.closest('.field-group');
            if (fieldGroup) {
                const errorElement = fieldGroup.querySelector('.error-message');
                if(errorElement) errorElement.textContent = '';
            }
        });
    };

    const adicionarCliente = async (event) => {
        event.preventDefault();
        if (!validarFormulario()) { return; }
        setSavingState(true);
        try {
            const [fotoFrenteBase64, fotoVersoBase64] = await Promise.all([
                compressAndEncodeImage(inputs.fotoFrente.files[0]),
                compressAndEncodeImage(inputs.fotoVerso.files[0])
            ]);
            
            const fotoAssinatura = signaturePad.isEmpty() ? null : signaturePad.toDataURL('image/png');

            const novoCliente = { 
                timestamp: new Date().toISOString(), 
                fotoFrenteBase64, 
                fotoVersoBase64,
                fotoAssinatura
            };
            
            Object.keys(regrasValidacao).forEach(key => { 
                novoCliente[key] = inputs[key].value;
            });
            novoCliente.consentimento = consentCheckbox.checked;
            
            clientes.push(novoCliente);
            salvarClientes();
            await db.collection("cadastros").add(novoCliente);
            ordenarEFiltrarClientes();
            limparFormulario();
            showToast('Cliente salvo e sincronizado!');
        } catch (error) {
            console.error("Erro ao processar e salvar:", error);
            showToast("Falha ao processar a imagem. Recarregue a página, refaça o cadastro sem foto e envie os documentos separadamente pelo WhatsApp", true);
        } finally {
            setSavingState(false);
        }
    };

    const excluirCliente = (clienteParaExcluir) => {
        if (confirm(`Tem certeza de que deseja excluir ${clienteParaExcluir.nome}?`)) {
            clientes = clientes.filter(c => c.timestamp !== clienteParaExcluir.timestamp);
            salvarClientes();
            ordenarEFiltrarClientes();
            showToast('Cliente excluído da lista local.');
        }
    };
    
    // --- SETUP DOS EVENT LISTENERS ---
    
    // Redimensionamento do Canvas de Assinatura
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        signatureCanvas.width = signatureCanvas.offsetWidth * ratio;
        signatureCanvas.height = signatureCanvas.offsetHeight * ratio;
        signatureCanvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear(); // Limpa após redimensionar
    }
    window.addEventListener('resize', resizeCanvas);

    // Validação de campos
    Object.keys(regrasValidacao).forEach(id => inputs[id]?.addEventListener('blur', () => validarCampo(id)));
    
    // Máscaras
    ['cpf', 'nascimento', 'celular'].forEach(id => {
        inputs[id].addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '');
            if (id === 'cpf') e.target.value = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            if (id === 'nascimento') e.target.value = v.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
            if (id === 'celular') e.target.value = v.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        });
    });
    ['numeroCasa', 'dataPagamento'].forEach(id => inputs[id].addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '')));
    
    // Lista de Clientes
    inputBusca.addEventListener('input', ordenarEFiltrarClientes);
    selectOrdenacao.addEventListener('change', ordenarEFiltrarClientes);
    
    // Modal de Imagem
    modalCloseBtn.addEventListener('click', hideImageModal);
    imageModal.addEventListener('click', (e) => { if(e.target === imageModal) hideImageModal(); });
    
    // Inputs de Arquivo
    ['fotoFrente', 'fotoVerso'].forEach(id => {
        inputs[id].addEventListener('change', () => {
            const filename = inputs[id].files.length > 0 ? inputs[id].files[0].name : 'Nenhum arquivo selecionado';
            document.getElementById(`${id}-filename`).textContent = filename;
        });
    });
    
    // Ações do Formulário
    form.addEventListener('submit', adicionarCliente);
    btnLimpar.addEventListener('click', limparFormulario);

    // Consentimento e Assinatura
    const abrirModalConsentimento = () => {
        consentModal.classList.add('visible');
        consentModalText.scrollTop = 0;
        btnConfirmarTermo.disabled = true;
    };
    
    openConsentModalLink.addEventListener('click', abrirModalConsentimento);
    consentCheckbox.addEventListener('click', (e) => {
        e.preventDefault(); // Impede a ação padrão
        abrirModalConsentimento();
    });

    consentModal.addEventListener('click', (e) => {
        if (e.target === consentModal) consentModal.classList.remove('visible');
    });
    consentModalText.addEventListener('scroll', (e) => {
        if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 10) {
            btnConfirmarTermo.disabled = false;
        }
    });
    btnConfirmarTermo.addEventListener('click', () => {
        consentCheckbox.checked = true;
        consentModal.classList.remove('visible');
    });
    clearSignatureBtn.addEventListener('click', () => {
        signaturePad.clear();
    });

    carregarClientes();
});
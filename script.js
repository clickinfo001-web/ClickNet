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
        termo1: document.getElementById('termo1'), termo2: document.getElementById('termo2'), termo3: document.getElementById('termo3'),
        termo4: document.getElementById('termo4'), termo5: document.getElementById('termo5'),
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

    let clientes = [];
    let clientesExibidos = [];

    const carregarClientes = () => { clientes = JSON.parse(localStorage.getItem('clientes') || '[]'); ordenarEFiltrarClientes(); };
    const salvarClientes = () => localStorage.setItem('clientes', JSON.stringify(clientes));
    const showToast = (message, isError = false) => { toast.textContent = message; toast.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--success-color)'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 5000); };
    const showImageModal = (base64) => { modalImagePreview.src = base64; imageModal.classList.add('visible'); };
    const hideImageModal = () => imageModal.classList.remove('visible');
    const setSavingState = (isSaving) => { btnSalvar.disabled = isSaving; btnSalvar.classList.toggle('loading', isSaving); };

    const regrasValidacao = {
        nome: { required: true, pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, message: 'Apenas letras, acentos e hífens.' },
        apelido: { pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, message: 'Apenas letras, acentos e hífens.' },
        cpf: { required: true, minLength: 14, message: 'CPF inválido.' },
        nascimento: { required: true, minLength: 10, message: 'Data inválida.' },
        estadoCivil: { pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, message: 'Apenas letras, acentos e hífens.' }, // Não é mais obrigatório
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
        const errorMessageElement = input.closest('.field-group').querySelector('.error-message');
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
    
    const validarFormulario = () => {
        const camposValidos = Object.keys(regrasValidacao).every(id => validarCampo(id));
        const termosValidos = ['termo1', 'termo2', 'termo3', 'termo4', 'termo5'].every(id => inputs[id].checked);
        if (!termosValidos) {
            showToast('É necessário aceitar todos os termos para continuar.', true);
        }
        return camposValidos && termosValidos;
    };
    
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
    const gerarPDF = async (cliente) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFont('Poppins', 'bold'); doc.setFontSize(18); doc.text('Ficha Cadastral - Clicknet', 14, 22);
        doc.setFont('Poppins', 'normal');
        const tableData = [['Nome Completo', cliente.nome], ['CPF', cliente.cpf], ['Data de Nascimento', cliente.nascimento], ['Estado Civil', cliente.estadoCivil || 'Não informado'], ['Endereço', `${cliente.rua}, ${cliente.numeroCasa || 'S/N'} - ${cliente.bairro}`], ['Ponto de Referência', cliente.pontoReferencia], ['Nº de Celular', cliente.celular], ['Plano', cliente.plano], ['Data de Pagamento', `Dia ${cliente.dataPagamento}`]];
        if (cliente.apelido) tableData.splice(1, 0, ['Apelido', cliente.apelido]);
        if (cliente.email) tableData.push(['E-mail', cliente.email]);
        if (cliente.indicacao) tableData.push(['Indicação', cliente.indicacao]);
        doc.autoTable({
            startY: 30, head: [['Campo', 'Valor']], body: tableData, theme: 'striped',
            headStyles: { fillColor: [255, 193, 7], textColor: 255, fontStyle: 'bold', font: 'Poppins', fontSize: 12 },
            bodyStyles: { font: 'Poppins', fontSize: 11, cellPadding: 3 },
            margin: { left: 14, right: 14 }
        });
        if (cliente.fotoFrenteBase64 || cliente.fotoVersoBase64) {
            doc.addPage();
            let currentY = 20;
            const pageContentWidth = doc.internal.pageSize.getWidth() - 28;
            const addImageToPdf = async (base64, title) => {
                if (!base64) return;
                try {
                    const dims = await getImageDimensions(base64);
                    const aspectRatio = dims.width / dims.height;
                    let imgWidth = pageContentWidth;
                    let imgHeight = imgWidth / aspectRatio;
                    const maxHeight = 120;
                    if(imgHeight > maxHeight) { imgHeight = maxHeight; imgWidth = imgHeight * aspectRatio; }
                    doc.setFont('Poppins', 'bold'); doc.setFontSize(14); doc.text(title, 14, currentY);
                    doc.addImage(base64, 'JPEG', 14, currentY + 5, imgWidth, imgHeight);
                    currentY += imgHeight + 20;
                } catch (e) { console.error("Erro ao adicionar imagem ao PDF:", e); }
            };
            await addImageToPdf(cliente.fotoFrenteBase64, 'Documento - Frente');
            await addImageToPdf(cliente.fotoVersoBase64, 'Documento - Verso');
        }
        doc.save(`cadastro_${cliente.nome.replace(/\s/g, '_')}.pdf`);
    };

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
                resolve(canvas.toDataURL('image/jpeg', 0.85)); // 85% qualidade
            };
            img.onerror = () => reject(new Error("Não foi possível carregar a imagem. O formato pode ser incompatível (ex: HEIC)."));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
        reader.readAsDataURL(file);
    });

    const limparFormulario = () => {
        form.reset();
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
            const novoCliente = { timestamp: new Date().toISOString(), fotoFrenteBase64, fotoVersoBase64 };
            Object.keys(inputs).forEach(key => { if (!key.startsWith('foto')) novoCliente[key] = inputs[key].type === 'checkbox' ? inputs[key].checked : inputs[key].value; });
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
    
    Object.keys(regrasValidacao).forEach(id => inputs[id].addEventListener('blur', () => validarCampo(id)));
    ['cpf', 'nascimento', 'celular'].forEach(id => {
        inputs[id].addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '');
            if (id === 'cpf') e.target.value = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            if (id === 'nascimento') e.target.value = v.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
            if (id === 'celular') e.target.value = v.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        });
    });
    ['numeroCasa', 'dataPagamento'].forEach(id => inputs[id].addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '')));
    inputBusca.addEventListener('input', ordenarEFiltrarClientes);
    selectOrdenacao.addEventListener('change', ordenarEFiltrarClientes);
    modalCloseBtn.addEventListener('click', hideImageModal);
    imageModal.addEventListener('click', (e) => { if(e.target === imageModal) hideImageModal(); });
    ['fotoFrente', 'fotoVerso'].forEach(id => {
        inputs[id].addEventListener('change', () => {
            const filename = inputs[id].files.length > 0 ? inputs[id].files[0].name : 'Nenhum arquivo selecionado';
            document.getElementById(`${id}-filename`).textContent = filename;
        });
    });
    form.addEventListener('submit', adicionarCliente);
    btnLimpar.addEventListener('click', limparFormulario);

    carregarClientes();
});

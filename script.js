document.addEventListener('DOMContentLoaded', () => {

    // --- SELEÇÃO DE TODOS OS ELEMENTOS ---
    const form = document.getElementById('cadastro-form');
    const inputs = {
        nome: document.getElementById('nome'),
        apelido: document.getElementById('apelido'),
        cpf: document.getElementById('cpf'),
        nascimento: document.getElementById('nascimento'),
        estadoCivil: document.getElementById('estadoCivil'),
        bairro: document.getElementById('bairro'),
        rua: document.getElementById('rua'),
        numeroCasa: document.getElementById('numeroCasa'),
        pontoReferencia: document.getElementById('pontoReferencia'),
        celular: document.getElementById('celular'),
        email: document.getElementById('email'),
        plano: document.getElementById('plano'),
        dataPagamento: document.getElementById('dataPagamento'),
        indicacao: document.getElementById('indicacao'),
        fotoFrente: document.getElementById('fotoFrente'),
        fotoVerso: document.getElementById('fotoVerso'),
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

    // --- ESTADO DA APLICAÇÃO ---
    let clientes = []; // Lista principal de clientes
    let clientesExibidos = []; // Lista para exibição (afetada por busca e ordenação)

    // --- FUNÇÕES DE PERSISTÊNCIA (Local Storage) ---
    const carregarClientes = () => {
        clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
        ordenarEFiltrarClientes();
    };

    const salvarClientes = () => {
        localStorage.setItem('clientes', JSON.stringify(clientes));
    };

    // --- FUNÇÕES DE UI (MODAL, TOAST, FEEDBACK) ---
    const showToast = (message, isError = false) => {
        toast.textContent = message;
        toast.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--success-color)';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const showImageModal = (base64) => {
        modalImagePreview.src = base64;
        imageModal.classList.add('visible');
    };

    const hideImageModal = () => {
        imageModal.classList.remove('visible');
    };
    
    const setSavingState = (isSaving) => {
        btnSalvar.disabled = isSaving;
        btnSalvar.classList.toggle('loading', isSaving);
    };

    // --- LÓGICA DE VALIDAÇÃO EM TEMPO REAL ---
    const regrasValidacao = {
        nome: { required: true, pattern: /^[A-Za-z\s]+$/, message: 'Apenas letras e espaços.' },
        apelido: { pattern: /^[A-Za-z\s]+$/, message: 'Apenas letras e espaços.' },
        cpf: { required: true, minLength: 14, message: 'CPF inválido.' },
        nascimento: { required: true, minLength: 10, message: 'Data inválida.' },
        estadoCivil: { required: true, pattern: /^[A-Za-z\s]+$/, message: 'Apenas letras.' },
        bairro: { required: true },
        rua: { required: true },
        numeroCasa: { pattern: /^\d*$/, message: 'Apenas números.' },
        pontoReferencia: { required: true },
        celular: { required: true, minLength: 15, message: 'Celular inválido.' },
        email: { pattern: /^\S+@\S+\.\S+$/, message: 'E-mail inválido.' },
        plano: { required: true },
        dataPagamento: { required: true, pattern: /^\d+$/, message: 'Apenas números.' },
        indicacao: { pattern: /^[A-Za-z\s]+$/, message: 'Apenas letras e espaços.' }
    };

    const validarCampo = (inputId) => {
        const input = inputs[inputId];
        const rule = regrasValidacao[inputId];
        const errorMessageElement = input.closest('.field-group').querySelector('.error-message');
        let isValid = true;
        let errorMessage = '';

        if (!rule) return true;

        const value = input.value.trim();

        if (rule.required && !value) {
            isValid = false;
            errorMessage = 'Campo obrigatório.';
        } else if (value) {
            if (rule.minLength && value.length < rule.minLength) {
                isValid = false;
                errorMessage = rule.message || `Mínimo de ${rule.minLength} caracteres.`;
            }
            if (rule.pattern && !rule.pattern.test(value)) {
                isValid = false;
                errorMessage = rule.message || 'Formato inválido.';
            }
        }
        
        input.classList.toggle('invalid', !isValid);
        if (errorMessageElement) errorMessageElement.textContent = errorMessage;
        return isValid;
    };

    const validarFormulario = () => {
        return Object.keys(regrasValidacao).every(id => validarCampo(id));
    };

    // --- LÓGICA DE BUSCA E ORDENAÇÃO ---
    const ordenarEFiltrarClientes = () => {
        let processados = [...clientes];
        
        // Filtragem por Busca
        const termoBusca = inputBusca.value.toLowerCase();
        if (termoBusca) {
            processados = processados.filter(c => 
                c.nome.toLowerCase().includes(termoBusca) || 
                c.cpf.includes(termoBusca)
            );
        }

        // Ordenação
        const tipoOrdenacao = selectOrdenacao.value;
        processados.sort((a, b) => {
            switch(tipoOrdenacao) {
                case 'nome-asc': return a.nome.localeCompare(b.nome);
                case 'nome-desc': return b.nome.localeCompare(a.nome);
                case 'data-asc': return new Date(a.timestamp) - new Date(b.timestamp);
                case 'data-desc':
                default: return new Date(b.timestamp) - new Date(a.timestamp);
            }
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
            const nomeHtml = `<h3>${cliente.nome} ${temImagem ? `<i class="bi bi-image-alt icon-imagem-anexada" title="Contém imagens"></i>` : ''}</h3>`;

            card.innerHTML = `
                <div class="cliente-info">
                    ${nomeHtml}
                    <p>${cliente.plano}</p>
                </div>
                <div class="cliente-actions">
                    <button class="btn-pdf"><i class="bi bi-file-earmark-pdf-fill"></i> PDF</button>
                    <button class="btn-excluir"><i class="bi bi-x-circle-fill"></i> Excluir</button>
                </div>
            `;
            
            card.querySelector('.btn-pdf').addEventListener('click', () => gerarPDF(cliente));
            card.querySelector('.btn-excluir').addEventListener('click', () => excluirCliente(cliente));
            if(temImagem) {
                card.querySelector('.icon-imagem-anexada').addEventListener('click', () => showImageModal(cliente.fotoFrenteBase64 || cliente.fotoVersoBase64));
            }

            listaClientesContainer.appendChild(card);
        });
    };

    // --- GERAÇÃO DE PDF APRIMORADA ---
    const getImageDimensions = (base64) => new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = base64;
    });

    const gerarPDF = async (cliente) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFont('Poppins', 'bold');
        doc.setFontSize(18);
        doc.text('Ficha Cadastral - Clicknet', 14, 22);

        doc.setFont('Poppins', 'normal');
        const tableData = [
            ['Nome Completo', cliente.nome], ['CPF', cliente.cpf], ['Data de Nascimento', cliente.nascimento], ['Estado Civil', cliente.estadoCivil],
            ['Endereço', `${cliente.rua}, ${cliente.numeroCasa || 'S/N'} - ${cliente.bairro}`], ['Ponto de Referência', cliente.pontoReferencia],
            ['Nº de Celular', cliente.celular], ['Plano', cliente.plano], ['Data de Pagamento', `Dia ${cliente.dataPagamento}`]
        ];
        if (cliente.apelido) tableData.splice(1, 0, ['Apelido', cliente.apelido]);
        if (cliente.email) tableData.push(['E-mail', cliente.email]);
        if (cliente.indicacao) tableData.push(['Indicação', cliente.indicacao]);

        doc.autoTable({
            startY: 30, head: [['Campo', 'Valor']], body: tableData, theme: 'striped',
            headStyles: { fillColor: [255, 193, 7], textColor: 255, fontStyle: 'bold', font: 'Poppins' },
            bodyStyles: { font: 'Poppins' }
        });

        if (cliente.fotoFrenteBase64 || cliente.fotoVersoBase64) {
            doc.addPage();
            let currentY = 20;
            const pageContentWidth = doc.internal.pageSize.getWidth() - 28;

            const addImageToPdf = async (base64, title) => {
                if (!base64) return;
                const dims = await getImageDimensions(base64);
                const aspectRatio = dims.width / dims.height;
                let imgWidth = pageContentWidth;
                let imgHeight = imgWidth / aspectRatio;
                
                const maxHeight = 120;
                if(imgHeight > maxHeight) {
                    imgHeight = maxHeight;
                    imgWidth = imgHeight * aspectRatio;
                }
                
                doc.setFont('Poppins', 'bold');
                doc.setFontSize(14);
                doc.text(title, 14, currentY);
                doc.addImage(base64, 'JPEG', 14, currentY + 5, imgWidth, imgHeight);
                currentY += imgHeight + 20;
            };

            await addImageToPdf(cliente.fotoFrenteBase64, 'Documento - Frente');
            await addImageToPdf(cliente.fotoVersoBase64, 'Documento - Verso');
        }

        doc.save(`cadastro_${cliente.nome.replace(/\s/g, '_')}.pdf`);
    };

    // --- LÓGICA PRINCIPAL DE CRUD ---
    const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    // ***** FUNÇÃO CORRIGIDA *****
    const limparFormulario = () => {
        form.reset(); // Limpa a maioria dos campos

        // Limpa manualmente os textos dos nomes dos arquivos
        document.getElementById('fotoFrente-filename').textContent = 'Nenhum arquivo selecionado';
        document.getElementById('fotoVerso-filename').textContent = 'Nenhum arquivo selecionado';

        // Remove todas as classes 'invalid' e mensagens de erro
        Object.keys(inputs).forEach(id => {
            const input = inputs[id];
            input.classList.remove('invalid');
            const errorElement = input.closest('.field-group').querySelector('.error-message');
            if(errorElement) {
                errorElement.textContent = '';
            }
        });
    };

    const adicionarCliente = async (event) => {
        event.preventDefault();
        if (!validarFormulario()) {
            showToast('Por favor, corrija os erros no formulário.', true);
            return;
        }

        setSavingState(true);
        let novoCliente;

        try {
            const [fotoFrenteBase64, fotoVersoBase64] = await Promise.all([
                readFileAsBase64(inputs.fotoFrente.files[0]),
                readFileAsBase64(inputs.fotoVerso.files[0])
            ]);
            
            novoCliente = { timestamp: new Date().toISOString(), fotoFrenteBase64, fotoVersoBase64 };
            Object.keys(inputs).forEach(key => {
                if (!key.startsWith('foto')) novoCliente[key] = inputs[key].value;
            });

            clientes.push(novoCliente);
            salvarClientes();

        } catch (error) {
            console.error("Erro ao processar e salvar:", error);
            showToast("Ocorreu um erro ao salvar os dados.", true);
            setSavingState(false);
            return; // Interrompe a execução em caso de erro no salvamento
        }

        // Se o try foi bem-sucedido, as operações de UI são executadas aqui
        ordenarEFiltrarClientes();
        limparFormulario();
        showToast('Cliente salvo com sucesso!');
        setSavingState(false);
    };

    const excluirCliente = (clienteParaExcluir) => {
        if (confirm(`Tem certeza de que deseja excluir ${clienteParaExcluir.nome}?`)) {
            clientes = clientes.filter(c => c.timestamp !== clienteParaExcluir.timestamp);
            salvarClientes();
            ordenarEFiltrarClientes();
            showToast('Cliente excluído.');
        }
    };
    
    // --- SETUP DOS EVENT LISTENERS ---
    Object.keys(regrasValidacao).forEach(id => {
        inputs[id].addEventListener('blur', () => validarCampo(id));
    });

    ['cpf', 'nascimento', 'celular'].forEach(id => {
        inputs[id].addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '');
            if (id === 'cpf') e.target.value = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            if (id === 'nascimento') e.target.value = v.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
            if (id === 'celular') e.target.value = v.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        });
    });
    
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

    // --- INICIALIZAÇÃO ---
    carregarClientes();
});

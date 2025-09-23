document.addEventListener('DOMContentLoaded', () => {

    // --- SELEÇÃO DOS ELEMENTOS DO HTML ---
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
    const btnLimpar = document.getElementById('btn-limpar');
    const listaClientesContainer = document.getElementById('lista-clientes-container');

    let clientes = [];

    // --- FUNÇÕES DE PERSISTÊNCIA (Local Storage) ---
    const carregarClientes = () => {
        const clientesJSON = localStorage.getItem('clientes') || '[]';
        clientes = JSON.parse(clientesJSON);
        renderizarLista();
    };

    const salvarClientes = () => {
        localStorage.setItem('clientes', JSON.stringify(clientes));
    };

    // --- FUNÇÃO DE GERAÇÃO DE PDF ---
    const gerarPDF = (cliente) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Ficha Cadastral - Clicknet', 14, 22);
        
        const tableData = [
            ['Nome Completo', cliente.nome],
            ['CPF', cliente.cpf],
            ['Data de Nascimento', cliente.nascimento],
            ['Estado Civil', cliente.estadoCivil],
            ['Endereço', `${cliente.rua}, ${cliente.numeroCasa || 'S/N'} - ${cliente.bairro}`],
            ['Ponto de Referência', cliente.pontoReferencia],
            ['Nº de Celular', cliente.celular],
            ['Plano', cliente.plano],
            ['Data de Pagamento', `Dia ${cliente.dataPagamento}`]
        ];
        
        if (cliente.apelido) tableData.splice(1, 0, ['Apelido', cliente.apelido]);
        if (cliente.email) tableData.push(['E-mail', cliente.email]);
        if (cliente.indicacao) tableData.push(['Indicação', cliente.indicacao]);

        doc.autoTable({
            startY: 30,
            head: [['Campo', 'Valor']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [255, 193, 7] }
        });

        // Adiciona as imagens no PDF, se existirem
        if (cliente.fotoFrenteBase64 || cliente.fotoVersoBase64) {
             doc.addPage();
             let finalY = 20; // Posição inicial na nova página
             if (cliente.fotoFrenteBase64) {
                try {
                    doc.setFontSize(14);
                    doc.text('Documento - Frente', 14, finalY);
                    doc.addImage(cliente.fotoFrenteBase64, 'JPEG', 14, finalY + 10, 180, 100);
                    finalY += 120; // Atualiza a posição para a próxima imagem
                } catch (e) { console.error("Erro ao adicionar imagem da frente ao PDF:", e); }
            }
            if (cliente.fotoVersoBase64) {
                try {
                    doc.setFontSize(14);
                    doc.text('Documento - Verso', 14, finalY);
                    doc.addImage(cliente.fotoVersoBase64, 'JPEG', 14, finalY + 10, 180, 100);
                } catch (e) { console.error("Erro ao adicionar imagem do verso ao PDF:", e); }
            }
        }

        doc.save(`cadastro_${cliente.nome.replace(/\s/g, '_')}.pdf`);
    };

    // --- RENDERIZAÇÃO E FORMULÁRIO ---
    const limparFormulario = () => form.reset();

    const renderizarLista = () => {
        listaClientesContainer.innerHTML = '';
        if (clientes.length === 0) {
            listaClientesContainer.innerHTML = '<p>Nenhum cliente cadastrado.</p>';
            return;
        }
        clientes.forEach((cliente, index) => {
            const card = document.createElement('div');
            card.className = 'cliente-card';
            const info = document.createElement('div');
            info.className = 'cliente-info';
            let nomeHtml = `<h3>${cliente.nome}</h3>`;
            if (cliente.fotoFrenteBase64 || cliente.fotoVersoBase64) {
                nomeHtml = `<h3>${cliente.nome} <i class="bi bi-image-alt icon-imagem-anexada" title="Contém imagens"></i></h3>`;
            }
            info.innerHTML = `${nomeHtml}<p>${cliente.plano}</p>`;
            const actions = document.createElement('div');
            actions.className = 'cliente-actions';
            const btnPdf = document.createElement('button');
            btnPdf.className = 'btn-pdf';
            btnPdf.innerHTML = '<i class="bi bi-file-earmark-pdf-fill"></i> PDF';
            btnPdf.onclick = () => gerarPDF(cliente);
            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn-excluir';
            btnExcluir.innerHTML = '<i class="bi bi-x-circle-fill"></i> Excluir';
            btnExcluir.onclick = () => excluirCliente(index);
            actions.appendChild(btnPdf);
            actions.appendChild(btnExcluir);
            card.appendChild(info);
            card.appendChild(actions);
            listaClientesContainer.appendChild(card);
        });
    };

    // --- FUNÇÃO DE VALIDAÇÃO FINAL (ANTES DE SALVAR) ---
    const validarCampos = () => {
        try {
            // Regra 1.1, 1.5, 1.13
            if (!/^[A-Za-z\s]+$/.test(inputs.nome.value) && inputs.nome.value) throw new Error('O campo "Nome Completo" deve conter apenas letras.');
            if (!/^[A-Za-z\s]+$/.test(inputs.apelido.value) && inputs.apelido.value) throw new Error('O campo "Apelido" deve conter apenas letras.');
            if (!/^[A-Za-z\s]+$/.test(inputs.estadoCivil.value) && inputs.estadoCivil.value) throw new Error('O campo "Estado Civil" deve conter apenas letras.');
            if (!/^[A-Za-z\s]+$/.test(inputs.indicacao.value) && inputs.indicacao.value) throw new Error('O campo "Indicação" deve conter apenas letras.');
            // Regra 1.11
            if (inputs.email.value && !/^\S+@\S+\.\S+$/.test(inputs.email.value)) throw new Error('O formato do E-mail é inválido.');
            
            // Verificação de campos obrigatórios
            const obrigatorios = { nome: "Nome Completo", cpf: "CPF", nascimento: "Data de Nascimento", estadoCivil: "Estado Civil", bairro: "Bairro", rua: "Rua", pontoReferencia: "Ponto de Referência", celular: "Nº de Celular", plano: "Plano", dataPagamento: "Data de Pagamento" };
            for(const id in obrigatorios) {
                if(!inputs[id].value.trim()) throw new Error(`O campo "${obrigatorios[id]}" é obrigatório.`);
            }
            return true;
        } catch (error) {
            alert(error.message);
            return false;
        }
    };
    
    // --- LÓGICA DE ADIÇÃO E EXCLUSÃO ---
    const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });

    const adicionarCliente = async (event) => {
        event.preventDefault();
        if (!validarCampos()) return;
        try {
            const [fotoFrenteBase64, fotoVersoBase64] = await Promise.all([
                readFileAsBase64(inputs.fotoFrente.files[0]),
                readFileAsBase64(inputs.fotoVerso.files[0])
            ]);
            const novoCliente = { timestamp: new Date().toISOString(), fotoFrenteBase64, fotoVersoBase64 };
            Object.keys(inputs).forEach(key => {
                if (!key.startsWith('foto')) novoCliente[key] = inputs[key].value;
            });
            clientes.push(novoCliente);
            salvarClientes();
            renderizarLista();
            limparFormulario();
        } catch (error) {
            console.error("Erro ao processar imagens:", error);
            alert("Ocorreu um erro ao salvar as imagens.");
        }
    };

    const excluirCliente = (index) => {
        if (confirm(`Tem certeza de que deseja excluir ${clientes[index].nome}?`)) {
            clientes.splice(index, 1);
            salvarClientes();
            renderizarLista();
        }
    };

    // --- MÁSCARAS E RESTRIÇÕES DE INPUT (VERSÃO CORRIGIDA) ---
    const aplicarRestricao = (input, regexFiltro) => {
        input.addEventListener('input', e => {
            const valorOriginal = e.target.value;
            const valorFiltrado = valorOriginal.replace(regexFiltro, '');
            if (valorOriginal !== valorFiltrado) {
                e.target.value = valorFiltrado;
            }
        });
    };

    // Regras 1.1, 1.2, 1.5, 1.13: Permitir apenas letras e espaços
    aplicarRestricao(inputs.nome, /[^A-Za-z\s]/g);
    aplicarRestricao(inputs.apelido, /[^A-Za-z\s]/g);
    aplicarRestricao(inputs.estadoCivil, /[^A-Za-z\s]/g);
    aplicarRestricao(inputs.indicacao, /[^A-Za-z\s]/g);

    // Regras 1.8, 1.12: Permitir apenas números
    aplicarRestricao(inputs.numeroCasa, /\D/g);
    aplicarRestricao(inputs.dataPagamento, /\D/g);

    // Regra 1.3: Autoformatação do CPF
    inputs.cpf.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '');
        v = v.slice(0, 11);
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        e.target.value = v;
    });

    // Regra 1.4: Autoformatação da Data de Nascimento
    inputs.nascimento.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '');
        v = v.slice(0, 8);
        if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
        else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
        e.target.value = v;
    });

    // Regra 1.10: Autoformatação do Celular
    inputs.celular.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '');
        v = v.slice(0, 11);
        if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        else if (v.length > 0) v = v.replace(/(\d{0,2})/, '($1');
        e.target.value = v;
    });

    // --- EVENT LISTENERS FINAIS ---
    form.addEventListener('submit', adicionarCliente);
    btnLimpar.addEventListener('click', limparFormulario);

    // --- INICIALIZAÇÃO ---
    carregarClientes();
});

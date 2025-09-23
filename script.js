// Garante que o script rode após o carregamento do HTML
document.addEventListener('DOMContentLoaded', () => {

    // --- SELEÇÃO DOS ELEMENTOS DO HTML ---
    const form = document.getElementById('cadastro-form');
    // Mapeamento de todos os inputs para fácil acesso
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
        indicacao: document.getElementById('indicacao')
    };
    const btnLimpar = document.getElementById('btn-limpar');
    const listaClientesContainer = document.getElementById('lista-clientes-container');

    // Estado da aplicação
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
        
        // Dados para a tabela do PDF
        const tableData = [
            ['Nome Completo', cliente.nome],
            ['CPF', cliente.cpf],
            ['Data de Nascimento', cliente.nascimento],
            ['Estado Civil', cliente.estadoCivil],
            ['Endereço', `${cliente.rua}, ${cliente.numeroCasa} - ${cliente.bairro}`],
            ['Ponto de Referência', cliente.pontoReferencia],
            ['Nº de Celular', cliente.celular],
            ['Plano', cliente.plano],
            ['Data de Pagamento', `Dia ${cliente.dataPagamento}`]
        ];
        
        // Adiciona campos opcionais apenas se eles existirem
        if (cliente.apelido) tableData.splice(1, 0, ['Apelido', cliente.apelido]);
        if (cliente.email) tableData.push(['E-mail', cliente.email]);
        if (cliente.indicacao) tableData.push(['Indicação', cliente.indicacao]);

        doc.autoTable({
            startY: 30,
            head: [['Campo', 'Valor']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [255, 193, 7] } // Cor Amber do seu tema
        });

        // Salva o arquivo
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
            info.innerHTML = `<h3>${cliente.nome}</h3><p>${cliente.plano}</p>`;

            const actions = document.createElement('div');
            actions.className = 'cliente-actions';

            const btnPdf = document.createElement('button');
            btnPdf.className = 'btn-pdf';
            btnPdf.textContent = 'Gerar PDF';
            btnPdf.onclick = () => gerarPDF(cliente);

            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn-excluir';
            btnExcluir.textContent = 'Excluir';
            btnExcluir.onclick = () => excluirCliente(index);

            actions.appendChild(btnPdf);
            actions.appendChild(btnExcluir);
            card.appendChild(info);
            card.appendChild(actions);
            listaClientesContainer.appendChild(card);
        });
    };
    
    // --- FUNÇÕES DE VALIDAÇÃO ---
    const validarCampos = () => {
        // Regex para validação
        const apenasLetras = /^[A-Za-z\s]+$/;
        const emailValido = /^\S+@\S+\.\S+$/;

        // Funções auxiliares de validação
        const checkRequired = (field, name) => {
            if (!inputs[field].value.trim()) throw new Error(`O campo "${name}" é obrigatório.`);
        };
        const checkPattern = (field, pattern, message) => {
            if (inputs[field].value && !pattern.test(inputs[field].value)) {
                throw new Error(message);
            }
        };

        try {
            // Validações
            checkRequired('nome', 'Nome Completo');
            checkPattern('nome', apenasLetras, 'O campo "Nome Completo" deve conter apenas letras.');

            checkPattern('apelido', apenasLetras, 'O campo "Apelido" deve conter apenas letras.');
            
            checkRequired('cpf', 'CPF');
            if (inputs.cpf.value.length !== 14) throw new Error('O CPF está incompleto.');

            checkRequired('nascimento', 'Data de Nascimento');
            if (inputs.nascimento.value.length !== 10) throw new Error('A Data de Nascimento está incompleta.');
            
            checkRequired('estadoCivil', 'Estado Civil');
            checkPattern('estadoCivil', apenasLetras, 'O campo "Estado Civil" deve conter apenas letras.');
            
            checkRequired('bairro', 'Bairro');
            checkRequired('rua', 'Rua');
            checkRequired('pontoReferencia', 'Ponto de Referência');
            
            checkRequired('celular', 'Nº de Celular');
            if (inputs.celular.value.length !== 15) throw new Error('O Nº de Celular está incompleto.');

            if (inputs.email.value) checkPattern('email', emailValido, 'O formato do E-mail é inválido.');
            
            checkRequired('plano', 'Plano');
            checkRequired('dataPagamento', 'Data de Pagamento');
            
            checkPattern('indicacao', apenasLetras, 'O campo "Indicação" deve conter apenas letras.');

            return true; // Se tudo estiver OK
        } catch (error) {
            alert(error.message); // Mostra o erro específico
            return false;
        }
    };

    // --- LÓGICA PRINCIPAL ---
    const adicionarCliente = (event) => {
        event.preventDefault();

        if (!validarCampos()) {
            return; // Para a execução se a validação falhar
        }

        const novoCliente = {};
        for (const key in inputs) {
            novoCliente[key] = inputs[key].value;
        }
        novoCliente.timestamp = new Date().toISOString();

        clientes.push(novoCliente);
        salvarClientes();
        renderizarLista();
        limparFormulario();
    };

    const excluirCliente = (index) => {
        if (confirm(`Tem certeza que deseja excluir ${clientes[index].nome}?`)) {
            clientes.splice(index, 1);
            salvarClientes();
            renderizarLista();
        }
    };
    
    // --- MÁSCARAS DE INPUT ---
    const aplicarMascara = (input, mascara) => {
        input.addEventListener('input', (e) => {
            const valorLimpo = e.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito
            e.target.value = mascara(valorLimpo);
        });
    };

    aplicarMascara(inputs.cpf, (v) => v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'));
    aplicarMascara(inputs.nascimento, (v) => v.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2'));
    aplicarMascara(inputs.celular, (v) => v.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2'));
    
    // Forçar apenas números em campos específicos
    ['numeroCasa', 'dataPagamento'].forEach(id => {
        inputs[id].addEventListener('input', e => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    });

    // Forçar apenas letras em campos específicos
    ['nome', 'apelido', 'estadoCivil', 'indicacao'].forEach(id => {
        inputs[id].addEventListener('input', e => {
            e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '');
        });
    });

    // --- EVENT LISTENERS ---
    form.addEventListener('submit', adicionarCliente);
    btnLimpar.addEventListener('click', limparFormulario);

    // Inicialização
    carregarClientes();
});
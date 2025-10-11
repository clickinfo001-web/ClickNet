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
    const auth = firebase.auth();
    const db = firebase.firestore();

    const loginContainer = document.getElementById('login-container');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('email');
    const loginPassword = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');
    const listaClientesContainer = document.getElementById('lista-clientes-container-admin');
    const inputBusca = document.getElementById('input-busca-admin');
    const selectOrdenacao = document.getElementById('select-ordenacao-admin');
    const imageModal = document.getElementById('image-modal');
    const modalImagePreview = document.getElementById('modal-image-preview');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const toast = document.getElementById('toast-notification');

    let todosClientes = [];
    let clientesExibidosAdmin = [];
    
    const showToast = (message, isError = false) => { toast.textContent = message; toast.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--success-color)'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); };
    const showImageModal = (base64) => { modalImagePreview.src = base64; imageModal.classList.add('visible'); };
    const hideImageModal = () => imageModal.classList.remove('visible');
    
    auth.onAuthStateChanged(user => {
        if (user) {
            loginContainer.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
            if (todosClientes.length === 0) fetchTodosClientes();
        } else {
            loginContainer.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const email = loginEmail.value;
        const password = loginPassword.value;
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                loginError.textContent = "E-mail ou senha inválidos.";
            });
    });

    btnLogout.addEventListener('click', () => auth.signOut());

    const fetchTodosClientes = () => {
        db.collection("cadastros").onSnapshot(snapshot => {
            todosClientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            ordenarEFiltrarClientesAdmin();
        }, error => {
            console.error("Erro ao buscar cadastros:", error);
            showToast("Não foi possível carregar os cadastros.", true);
        });
    };
    
    const ordenarEFiltrarClientesAdmin = () => {
        let processados = [...todosClientes];
        const termoBusca = inputBusca.value.toLowerCase();
        if (termoBusca) {
            processados = processados.filter(c => c.nome.toLowerCase().includes(termoBusca) || (c.cpf && c.cpf.includes(termoBusca)));
        }
        processados.sort((a, b) => {
            const tipo = selectOrdenacao.value;
            if (tipo === 'nome-asc') return a.nome.localeCompare(b.nome);
            if (tipo === 'nome-desc') return b.nome.localeCompare(a.nome);
            if (tipo === 'data-asc') return new Date(a.timestamp) - new Date(b.timestamp);
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        clientesExibidosAdmin = processados;
        renderizarListaAdmin();
    };
    
    const renderizarListaAdmin = () => {
        listaClientesContainer.innerHTML = '';
        if (clientesExibidosAdmin.length === 0) {
            listaClientesContainer.innerHTML = '<p>Nenhum cliente encontrado.</p>';
            return;
        }
        clientesExibidosAdmin.forEach((cliente) => {
            const card = document.createElement('div');
            card.className = 'cliente-card';
            const temImagem = cliente.fotoFrenteBase64 || cliente.fotoVersoBase64;
            const nomeHtml = `<h3>${cliente.nome} ${temImagem ? `<i class="bi bi-image-alt icon-imagem-anexada" title="Ver imagem"></i>` : ''}</h3>`;
            card.innerHTML = `<div class="cliente-info">${nomeHtml}<p>${cliente.plano} - ${cliente.cpf}</p></div><div class="cliente-actions"><button class="btn-pdf"><i class="bi bi-file-earmark-pdf-fill"></i> PDF</button><button class="btn-excluir"><i class="bi bi-x-circle-fill"></i> Excluir</button></div>`;
            card.querySelector('.btn-pdf').addEventListener('click', () => gerarPDF(cliente));
            card.querySelector('.btn-excluir').addEventListener('click', () => excluirClienteDoFirestore(cliente));
            if(temImagem) card.querySelector('.icon-imagem-anexada').addEventListener('click', () => showImageModal(cliente.fotoFrenteBase64 || cliente.fotoVersoBase64));
            listaClientesContainer.appendChild(card);
        });
    };

    const excluirClienteDoFirestore = (cliente) => {
        if (confirm(`ADMIN: Tem certeza que deseja excluir ${cliente.nome} PERMANENTEMENTE de todos os registros?`)) {
            db.collection("cadastros").doc(cliente.id).delete()
            .then(() => showToast("Cliente excluído do servidor."))
            .catch(err => showToast("Erro ao excluir cliente.", true));
        }
    };
    
    const getImageDimensions = (base64) => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve({ width: img.width, height: img.height }); img.onerror = reject; img.src = base64; });
    
    // =================================================================================
    // FUNÇÃO GERAR PDF - ATUALIZADA
    // =================================================================================
    const gerarPDF = async (cliente) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Título Centralizado
        doc.setFont('Poppins', 'bold');
        doc.setFontSize(18);
        doc.text('Ficha Contratual ClickNet', pageWidth / 2, 22, { align: 'center' });

        // Tabela de Dados
        doc.setFont('Poppins', 'normal');
        const tableData = [['Nome Completo', cliente.nome], ['CPF', cliente.cpf], ['Data de Nascimento', cliente.nascimento], ['Estado Civil', cliente.estadoCivil || 'Não informado'], ['Endereço', `${cliente.rua}, ${cliente.numeroCasa || 'S/N'} - ${cliente.bairro}`], ['Ponto de Referência', cliente.pontoReferencia], ['Nº de Celular', cliente.celular], ['Plano', cliente.plano], ['Data de Pagamento', `Dia ${cliente.dataPagamento}`]];
        if (cliente.apelido) tableData.splice(1, 0, ['Apelido', cliente.apelido]);
        if (cliente.email) tableData.push(['E-mail', cliente.email]);
        if (cliente.indicacao) tableData.push(['Indicação', cliente.indicacao]);
        
        doc.autoTable({
            startY: 30,
            head: [['Campo', 'Valor']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [255, 193, 7], textColor: 255, fontStyle: 'bold', font: 'Poppins', fontSize: 12 },
            bodyStyles: { font: 'Poppins', fontSize: 12, cellPadding: 3.5 }, // Legibilidade aumentada
            margin: { left: 14, right: 14 }
        });

        // Termos Aceitos
        let finalY = doc.lastAutoTable.finalY + 15;
        doc.setFont('Poppins', 'bold');
        doc.setFontSize(11);
        doc.text('Termos e Condições Aceitos:', 14, finalY);
        finalY += 7;

        doc.setFont('Poppins', 'normal');
        doc.setFontSize(9);
        const margin = 14;
        const maxWidth = pageWidth - margin * 2;
        
        const termos = [
            "Pagamentos e prazos: Estou ciente de que devo manter minhas faturas em dia. Após 10 dias úteis de atraso, meu serviço poderá ser bloqueado e, com 30 dias, poderei ser notificado para recolhimento do equipamento até a regularização.",
            "Condições gerais: Reconheço que a Click Net não possui contrato anual nem cobra juros por atraso, e que em imóveis alugados o pagamento é antecipado.",
            "Mudança de endereço: Concordo que só posso solicitar mudança de endereço após 90 dias da instalação. Antes disso, será cobrada taxa de R$ 89,90 por mudança.",
            "Desbloqueio temporário: Estou ciente de que o desbloqueio em confiança pode ser concedido apenas em casos específicos e por até 3 dias.",
            "Instalação e equipamentos: Reconheço que a instalação é gratuita e que o equipamento é emprestado enquanto meu plano estiver ativo."
        ];

        termos.forEach(termo => {
            if (finalY > pageHeight - 20) { // Verifica se precisa de nova página
                 doc.addPage();
                 finalY = 20;
            }
            const lines = doc.splitTextToSize(`• ${termo}`, maxWidth);
            doc.text(lines, margin, finalY);
            finalY += (lines.length * 4) + 4; // Ajusta o espaçamento
        });

        // Imagens dos Documentos
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
                } catch(e) { console.error("Erro ao adicionar imagem ao PDF (admin):", e); }
            };
            await addImageToPdf(cliente.fotoFrenteBase64, 'Documento - Frente');
            await addImageToPdf(cliente.fotoVersoBase64, 'Documento - Verso');
        }
        doc.save(`contrato_${cliente.nome.replace(/\s/g, '_')}.pdf`);
    };

    inputBusca.addEventListener('input', ordenarEFiltrarClientesAdmin);
    selectOrdenacao.addEventListener('change', ordenarEFiltrarClientesAdmin);
    modalCloseBtn.addEventListener('click', hideImageModal);
    imageModal.addEventListener('click', (e) => { if(e.target === imageModal) hideImageModal(); });
});

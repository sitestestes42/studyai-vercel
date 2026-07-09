// ============================================================
// CONFIGURAÇÃO SUPABASE
// ============================================================
const SUPABASE_URL = 'https://vpihrpqvzrmixxdrqwbj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ucBzmjp0Xbwi7Z-RHsk4Yg_LydKnMMZ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// VARIÁVEIS GLOBAIS
// ============================================================
let usuarioAtual = null;
let conversaAtualId = null;
let todasConversas = [];
let mensagensCache = {};
let modoPaiAtual = 'estudo';
let idiomaAtual = 'pt';

// ============================================================
// TRADUÇÕES (PT, EN, ES)
// ============================================================
const traducoes = {
    pt: {
        login_subtitle: 'Sua IA de estudos',
        login_entrar: 'Entrar',
        login_google: 'Entrar com Google',
        login_cadastro: 'Criar conta',
        login_recuperar: 'Esqueci a senha',
        btn_nova: 'Nova',
        drawer_conversas: 'Conversas',
        drawer_nova_conv: 'Nova conversa',
        drawer_topicos: 'Tópicos da conversa',
        drawer_ferramentas: 'Ferramentas',
        drawer_estudo: 'Estudo',
        drawer_flashcards: 'Flashcards',
        drawer_redacao: 'Redação',
        drawer_vestibulinho: 'Vestibulinho',
        drawer_grupo: 'Grupo',
        drawer_aulas: 'Aulas',
        drawer_relatorios: 'Relatórios',
        drawer_configuracoes: 'Configurações',
        chat_status: 'Online',
        chat_placeholder_estudo: 'Digite sua pergunta sobre estudos...',
        chat_placeholder_cotidiano: 'Digite sua pergunta sobre o dia a dia...',
        saudacao_titulo: 'Olá!',
        saudacao_subtitulo: 'Como posso ajudar você hoje?',
        modo_smart: '🧠 Smart',
        modo_deeper: '🔬 Think Deeper',
        modo_learn: '📚 Estude e Aprenda',
        modo_search: '🌐 Pesquisar',
        modo_pratico: '⚡ Prático',
        modo_inspire: '💡 Inspire-se',
        modo_explique: '📝 Explique',
        modo_liste: '📋 Liste',
        estudo_titulo: 'Sessão de Estudo',
        estudo_subtitulo: 'Foque, estude e no final a IA gera flashcards e quiz.',
        estudo_iniciar: 'Iniciar',
        estudo_finalizar: 'Finalizar',
        pos_estudo_titulo: 'O que você estudou?',
        pos_gerar: 'Gerar Flashcards e Quiz',
        flashcards_titulo: 'Flashcards',
        flashcards_subtitulo: 'Revisão espaçada – revise hoje!',
        redacao_titulo: 'Corretor de Redação',
        redacao_subtitulo: 'Cole sua redação e receba correção estilo ENEM.',
        redacao_corrigir: 'Corrigir Redação',
        vest_titulo: 'Vestibulinho',
        vest_subtitulo: '20 questões geradas por IA.',
        vest_gerar: 'Gerar Simulado',
        grupo_titulo: 'Grupo de Estudos',
        grupo_subtitulo: 'Estude com amigos, compartilhe progresso.',
        grupo_criar_titulo: 'Criar Grupo',
        grupo_criar_btn: 'Criar',
        grupo_entrar_titulo: 'Entrar em Grupo',
        grupo_entrar_btn: 'Entrar',
        grupo_sair_btn: 'Sair do Grupo',
        grupo_membros_titulo: 'Membros',
        grupo_ranking_titulo: 'Ranking',
        grupo_ranking_semanal: 'Semanal',
        grupo_ranking_mensal: 'Mensal',
        grupo_chat_titulo: 'Chat do Grupo',
        aulas_titulo: 'Aulas',
        aulas_subtitulo: 'Playlists do YouTube para estudar.',
        aulas_add_titulo: 'Adicionar Aula',
        aulas_add_btn: 'Adicionar',
        rel_titulo: 'Relatórios',
        rel_subtitulo: 'Acompanhe sua evolução.',
        rel_total: 'Minutos totais',
        rel_sessoes: 'Sessões',
        rel_flashcards: 'Flashcards',
        rel_racha: 'Dias seguidos',
        config_titulo: 'Configurações',
        config_subtitulo: 'Personalize sua experiência no SiriusLearn.',
        config_idioma_titulo: 'Idioma',
        config_idioma_desc: 'Escolha o idioma da interface e das respostas da IA.',
        config_conta_titulo: 'Conta',
        config_conta_desc: 'Gerencie suas informações pessoais.',
        config_editar_nome: 'Alterar nome',
        config_alterar_senha: 'Alterar senha',
    },
    en: {
        login_subtitle: 'Your AI Study Assistant',
        login_entrar: 'Sign In',
        login_google: 'Sign in with Google',
        login_cadastro: 'Create account',
        login_recuperar: 'Forgot password',
        btn_nova: 'New',
        drawer_conversas: 'Conversations',
        drawer_nova_conv: 'New conversation',
        drawer_topicos: 'Conversation topics',
        drawer_ferramentas: 'Tools',
        drawer_estudo: 'Study',
        drawer_flashcards: 'Flashcards',
        drawer_redacao: 'Essay',
        drawer_vestibulinho: 'Quiz',
        drawer_grupo: 'Group',
        drawer_aulas: 'Lessons',
        drawer_relatorios: 'Reports',
        drawer_configuracoes: 'Settings',
        chat_status: 'Online',
        chat_placeholder_estudo: 'Ask your study question...',
        chat_placeholder_cotidiano: 'Ask about daily life...',
        saudacao_titulo: 'Hello!',
        saudacao_subtitulo: 'How can I help you today?',
        modo_smart: '🧠 Smart',
        modo_deeper: '🔬 Think Deeper',
        modo_learn: '📚 Learn',
        modo_search: '🌐 Search',
        modo_pratico: '⚡ Practical',
        modo_inspire: '💡 Inspire',
        modo_explique: '📝 Explain',
        modo_liste: '📋 List',
        estudo_titulo: 'Study Session',
        estudo_subtitulo: 'Focus, study and AI generates flashcards and quiz.',
        estudo_iniciar: 'Start',
        estudo_finalizar: 'Finish',
        pos_estudo_titulo: 'What did you study?',
        pos_gerar: 'Generate Flashcards & Quiz',
        flashcards_titulo: 'Flashcards',
        flashcards_subtitulo: 'Spaced repetition – review today!',
        redacao_titulo: 'Essay Corrector',
        redacao_subtitulo: 'Paste your essay and get ENEM-style correction.',
        redacao_corrigir: 'Correct Essay',
        vest_titulo: 'Quiz',
        vest_subtitulo: '20 AI-generated questions.',
        vest_gerar: 'Generate Quiz',
        grupo_titulo: 'Study Group',
        grupo_subtitulo: 'Study with friends, share progress.',
        grupo_criar_titulo: 'Create Group',
        grupo_criar_btn: 'Create',
        grupo_entrar_titulo: 'Join Group',
        grupo_entrar_btn: 'Join',
        grupo_sair_btn: 'Leave Group',
        grupo_membros_titulo: 'Members',
        grupo_ranking_titulo: 'Ranking',
        grupo_ranking_semanal: 'Weekly',
        grupo_ranking_mensal: 'Monthly',
        grupo_chat_titulo: 'Group Chat',
        aulas_titulo: 'Lessons',
        aulas_subtitulo: 'YouTube playlists to study.',
        aulas_add_titulo: 'Add Lesson',
        aulas_add_btn: 'Add',
        rel_titulo: 'Reports',
        rel_subtitulo: 'Track your progress.',
        rel_total: 'Total minutes',
        rel_sessoes: 'Sessions',
        rel_flashcards: 'Flashcards',
        rel_racha: 'Days streak',
        config_titulo: 'Settings',
        config_subtitulo: 'Customize your SiriusLearn experience.',
        config_idioma_titulo: 'Language',
        config_idioma_desc: 'Choose the interface and AI response language.',
        config_conta_titulo: 'Account',
        config_conta_desc: 'Manage your personal information.',
        config_editar_nome: 'Change name',
        config_alterar_senha: 'Change password',
    },
    es: {
        login_subtitle: 'Tu IA de estudios',
        login_entrar: 'Iniciar sesión',
        login_google: 'Iniciar con Google',
        login_cadastro: 'Crear cuenta',
        login_recuperar: 'Olvidé contraseña',
        btn_nova: 'Nueva',
        drawer_conversas: 'Conversaciones',
        drawer_nova_conv: 'Nueva conversación',
        drawer_topicos: 'Temas de la conversación',
        drawer_ferramentas: 'Herramientas',
        drawer_estudo: 'Estudio',
        drawer_flashcards: 'Tarjetas',
        drawer_redacao: 'Redacción',
        drawer_vestibulinho: 'Examen',
        drawer_grupo: 'Grupo',
        drawer_aulas: 'Clases',
        drawer_relatorios: 'Informes',
        drawer_configuracoes: 'Configuraciones',
        chat_status: 'En línea',
        chat_placeholder_estudo: 'Haz tu pregunta de estudio...',
        chat_placeholder_cotidiano: 'Pregunta sobre la vida diaria...',
        saudacao_titulo: '¡Hola!',
        saudacao_subtitulo: '¿Cómo puedo ayudarte hoy?',
        modo_smart: '🧠 Smart',
        modo_deeper: '🔬 Piensa más',
        modo_learn: '📚 Aprende',
        modo_search: '🌐 Buscar',
        modo_pratico: '⚡ Práctico',
        modo_inspire: '💡 Inspírate',
        modo_explique: '📝 Explica',
        modo_liste: '📋 Lista',
        estudo_titulo: 'Sesión de Estudio',
        estudo_subtitulo: 'Enfócate, estudia y la IA genera tarjetas y examen.',
        estudo_iniciar: 'Iniciar',
        estudo_finalizar: 'Finalizar',
        pos_estudo_titulo: '¿Qué estudiaste?',
        pos_gerar: 'Generar Tarjetas y Examen',
        flashcards_titulo: 'Tarjetas de Estudio',
        flashcards_subtitulo: 'Repetición espaciada – ¡revisa hoy!',
        redacao_titulo: 'Corrector de Redacción',
        redacao_subtitulo: 'Pega tu redacción y recibe corrección estilo ENEM.',
        redacao_corrigir: 'Corregir Redacción',
        vest_titulo: 'Examen',
        vest_subtitulo: '20 preguntas generadas por IA.',
        vest_gerar: 'Generar Examen',
        grupo_titulo: 'Grupo de Estudio',
        grupo_subtitulo: 'Estudia con amigos, comparte progreso.',
        grupo_criar_titulo: 'Crear Grupo',
        grupo_criar_btn: 'Crear',
        grupo_entrar_titulo: 'Unirse al Grupo',
        grupo_entrar_btn: 'Unirse',
        grupo_sair_btn: 'Salir del Grupo',
        grupo_membros_titulo: 'Miembros',
        grupo_ranking_titulo: 'Clasificación',
        grupo_ranking_semanal: 'Semanal',
        grupo_ranking_mensal: 'Mensual',
        grupo_chat_titulo: 'Chat del Grupo',
        aulas_titulo: 'Clases',
        aulas_subtitulo: 'Listas de YouTube para estudiar.',
        aulas_add_titulo: 'Agregar Clase',
        aulas_add_btn: 'Agregar',
        rel_titulo: 'Informes',
        rel_subtitulo: 'Sigue tu evolución.',
        rel_total: 'Minutos totales',
        rel_sessoes: 'Sesiones',
        rel_flashcards: 'Tarjetas',
        rel_racha: 'Días seguidos',
        config_titulo: 'Configuraciones',
        config_subtitulo: 'Personaliza tu experiencia en SiriusLearn.',
        config_idioma_titulo: 'Idioma',
        config_idioma_desc: 'Elige el idioma de la interfaz y respuestas de IA.',
        config_conta_titulo: 'Cuenta',
        config_conta_desc: 'Gestiona tu información personal.',
        config_editar_nome: 'Cambiar nombre',
        config_alterar_senha: 'Cambiar contraseña',
    }
};

function t(chave) {
    return traducoes[idiomaAtual]?.[chave] || chave;
}

function aplicarTraducao() {
    // Login
    const loginSubtitle = document.getElementById('login-subtitle');
    if (loginSubtitle) loginSubtitle.textContent = t('login_subtitle');
    const loginBtnText = document.getElementById('login-btn-text');
    if (loginBtnText) loginBtnText.textContent = t('login_entrar');
    const loginGoogleText = document.getElementById('login-google-text');
    if (loginGoogleText) loginGoogleText.textContent = t('login_google');
    const linkCadastro = document.getElementById('link-cadastro');
    if (linkCadastro) linkCadastro.textContent = t('login_cadastro');
    const linkRecuperar = document.getElementById('link-recuperar');
    if (linkRecuperar) linkRecuperar.textContent = t('login_recuperar');

    // Top bar
    const btnNovaText = document.getElementById('btn-nova-text');
    if (btnNovaText) btnNovaText.textContent = t('btn_nova');

    // Drawer
    const drawerConversas = document.getElementById('drawer-conversas-titulo');
    if (drawerConversas) drawerConversas.textContent = t('drawer_conversas');
    const drawerNovaConv = document.getElementById('drawer-nova-conv');
    if (drawerNovaConv) drawerNovaConv.textContent = t('drawer_nova_conv');
    const drawerTopicos = document.getElementById('drawer-topicos-titulo');
    if (drawerTopicos) drawerTopicos.textContent = t('drawer_topicos');
    const drawerFerramentas = document.getElementById('drawer-ferramentas-titulo');
    if (drawerFerramentas) drawerFerramentas.textContent = t('drawer_ferramentas');

    document.querySelectorAll('.drawer-item').forEach(el => {
        const span = el.querySelector('span');
        if (span) {
            const chave = el.dataset.tab;
            const map = {
                chat: 'Chat',
                estudo: t('drawer_estudo'),
                flashcards: t('drawer_flashcards'),
                redacao: t('drawer_redacao'),
                vestibulinho: t('drawer_vestibulinho'),
                grupo: t('drawer_grupo'),
                aulas: t('drawer_aulas'),
                relatorios: t('drawer_relatorios'),
                configuracoes: t('drawer_configuracoes')
            };
            span.textContent = map[chave] || chave;
        }
    });

    // Chat
    const chatStatus = document.getElementById('chat-status-text');
    if (chatStatus) chatStatus.textContent = t('chat_status');
    const saudacaoTitulo = document.getElementById('saudacao-titulo');
    if (saudacaoTitulo) saudacaoTitulo.textContent = t('saudacao_titulo');
    const saudacaoSubtitulo = document.getElementById('saudacao-subtitulo');
    if (saudacaoSubtitulo) saudacaoSubtitulo.textContent = t('saudacao_subtitulo');
    atualizarPlaceholderChat();
    atualizarModos();

    // Estudo
    document.querySelectorAll('[id^="estudo-"]').forEach(el => {
        if (el.id === 'estudo-titulo') el.textContent = t('estudo_titulo');
        else if (el.id === 'estudo-subtitulo') el.textContent = t('estudo_subtitulo');
        else if (el.id === 'estudo-iniciar') el.textContent = t('estudo_iniciar');
        else if (el.id === 'estudo-finalizar') el.textContent = t('estudo_finalizar');
        else if (el.id === 'pos-estudo-titulo') el.textContent = t('pos_estudo_titulo');
        else if (el.id === 'pos-gerar') el.textContent = t('pos_gerar');
    });

    // Flashcards
    const flashcardsTitulo = document.getElementById('flashcards-titulo');
    if (flashcardsTitulo) flashcardsTitulo.textContent = t('flashcards_titulo');
    const flashcardsSubtitulo = document.getElementById('flashcards-subtitulo');
    if (flashcardsSubtitulo) flashcardsSubtitulo.textContent = t('flashcards_subtitulo');

    // Redação
    const redacaoTitulo = document.getElementById('redacao-titulo');
    if (redacaoTitulo) redacaoTitulo.textContent = t('redacao_titulo');
    const redacaoSubtitulo = document.getElementById('redacao-subtitulo');
    if (redacaoSubtitulo) redacaoSubtitulo.textContent = t('redacao_subtitulo');
    const redacaoCorrigir = document.getElementById('redacao-corrigir');
    if (redacaoCorrigir) redacaoCorrigir.textContent = t('redacao_corrigir');

    // Vestibulinho
    const vestTitulo = document.getElementById('vest-titulo');
    if (vestTitulo) vestTitulo.textContent = t('vest_titulo');
    const vestSubtitulo = document.getElementById('vest-subtitulo');
    if (vestSubtitulo) vestSubtitulo.textContent = t('vest_subtitulo');
    const vestGerar = document.getElementById('vest-gerar');
    if (vestGerar) vestGerar.textContent = t('vest_gerar');

    // Grupo
    const grupoTitulo = document.getElementById('grupo-titulo');
    if (grupoTitulo) grupoTitulo.textContent = t('grupo_titulo');
    const grupoSubtitulo = document.getElementById('grupo-subtitulo');
    if (grupoSubtitulo) grupoSubtitulo.textContent = t('grupo_subtitulo');
    const grupoCriarTitulo = document.getElementById('grupo-criar-titulo');
    if (grupoCriarTitulo) grupoCriarTitulo.textContent = t('grupo_criar_titulo');
    const grupoCriarBtn = document.getElementById('grupo-criar-btn');
    if (grupoCriarBtn) grupoCriarBtn.textContent = t('grupo_criar_btn');
    const grupoEntrarTitulo = document.getElementById('grupo-entrar-titulo');
    if (grupoEntrarTitulo) grupoEntrarTitulo.textContent = t('grupo_entrar_titulo');
    const grupoEntrarBtn = document.getElementById('grupo-entrar-btn');
    if (grupoEntrarBtn) grupoEntrarBtn.textContent = t('grupo_entrar_btn');
    const grupoSairBtn = document.getElementById('grupo-sair-btn');
    if (grupoSairBtn) grupoSairBtn.textContent = t('grupo_sair_btn');
    const grupoMembrosTitulo = document.getElementById('grupo-membros-titulo');
    if (grupoMembrosTitulo) grupoMembrosTitulo.textContent = t('grupo_membros_titulo');
    const grupoRankingTitulo = document.getElementById('grupo-ranking-titulo');
    if (grupoRankingTitulo) grupoRankingTitulo.textContent = t('grupo_ranking_titulo');
    const grupoRankingSemanal = document.getElementById('grupo-ranking-semanal');
    if (grupoRankingSemanal) grupoRankingSemanal.textContent = t('grupo_ranking_semanal');
    const grupoRankingMensal = document.getElementById('grupo-ranking-mensal');
    if (grupoRankingMensal) grupoRankingMensal.textContent = t('grupo_ranking_mensal');
    const grupoChatTitulo = document.getElementById('grupo-chat-titulo');
    if (grupoChatTitulo) grupoChatTitulo.textContent = t('grupo_chat_titulo');

    // Aulas
    const aulasTitulo = document.getElementById('aulas-titulo');
    if (aulasTitulo) aulasTitulo.textContent = t('aulas_titulo');
    const aulasSubtitulo = document.getElementById('aulas-subtitulo');
    if (aulasSubtitulo) aulasSubtitulo.textContent = t('aulas_subtitulo');
    const aulasAddTitulo = document.getElementById('aulas-add-titulo');
    if (aulasAddTitulo) aulasAddTitulo.textContent = t('aulas_add_titulo');
    const aulasAddBtn = document.getElementById('aulas-add-btn');
    if (aulasAddBtn) aulasAddBtn.textContent = t('aulas_add_btn');

    // Relatórios
    const relTitulo = document.getElementById('rel-titulo');
    if (relTitulo) relTitulo.textContent = t('rel_titulo');
    const relSubtitulo = document.getElementById('rel-subtitulo');
    if (relSubtitulo) relSubtitulo.textContent = t('rel_subtitulo');
    const relTotalLabel = document.getElementById('rel-total-label');
    if (relTotalLabel) relTotalLabel.textContent = t('rel_total');
    const relSessoesLabel = document.getElementById('rel-sessoes-label');
    if (relSessoesLabel) relSessoesLabel.textContent = t('rel_sessoes');
    const relFlashcardsLabel = document.getElementById('rel-flashcards-label');
    if (relFlashcardsLabel) relFlashcardsLabel.textContent = t('rel_flashcards');
    const relRachaLabel = document.getElementById('rel-racha-label');
    if (relRachaLabel) relRachaLabel.textContent = t('rel_racha');

    // Configurações
    const configTitulo = document.getElementById('config-titulo');
    if (configTitulo) configTitulo.textContent = t('config_titulo');
    const configSubtitulo = document.getElementById('config-subtitulo');
    if (configSubtitulo) configSubtitulo.textContent = t('config_subtitulo');
    const configIdiomaTitulo = document.getElementById('config-idioma-titulo');
    if (configIdiomaTitulo) configIdiomaTitulo.textContent = t('config_idioma_titulo');
    const configIdiomaDesc = document.getElementById('config-idioma-desc');
    if (configIdiomaDesc) configIdiomaDesc.textContent = t('config_idioma_desc');
    const configContaTitulo = document.getElementById('config-conta-titulo');
    if (configContaTitulo) configContaTitulo.textContent = t('config_conta_titulo');
    const configContaDesc = document.getElementById('config-conta-desc');
    if (configContaDesc) configContaDesc.textContent = t('config_conta_desc');
    const configEditarNome = document.getElementById('config-editar-nome');
    if (configEditarNome) configEditarNome.textContent = t('config_editar_nome');
    const configAlterarSenha = document.getElementById('config-alterar-senha');
    if (configAlterarSenha) configAlterarSenha.textContent = t('config_alterar_senha');

    const idiomaLabel = document.getElementById('idioma-label');
    if (idiomaLabel) idiomaLabel.textContent = idiomaAtual.toUpperCase();
}

function atualizarPlaceholderChat() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    input.placeholder = modoPaiAtual === 'estudo'
        ? t('chat_placeholder_estudo')
        : t('chat_placeholder_cotidiano');
}

// ============================================================
// MODOS
// ============================================================
const opcoesModo = {
    estudo: ['smart', 'deeper', 'learn', 'search'],
    cotidiano: ['pratico', 'inspire', 'explique', 'liste']
};
const labelsModo = {
    estudo: {
        smart: '🧠 Smart',
        deeper: '🔬 Think Deeper',
        learn: '📚 Estude e Aprenda',
        search: '🌐 Pesquisar'
    },
    cotidiano: {
        pratico: '⚡ Prático',
        inspire: '💡 Inspire-se',
        explique: '📝 Explique',
        liste: '📋 Liste'
    }
};

function atualizarModos() {
    const select = document.getElementById('modo-select');
    if (!select) return;
    const opcoes = opcoesModo[modoPaiAtual];
    const labels = labelsModo[modoPaiAtual];
    select.innerHTML = '';
    opcoes.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = labels[valor];
        select.appendChild(option);
    });
    select.value = opcoes[0];
    atualizarPlaceholderChat();
}

document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('toggle-modo-pai');
    if (toggle) {
        toggle.addEventListener('change', function() {
            modoPaiAtual = this.checked ? 'cotidiano' : 'estudo';
            atualizarModos();
            const estudoLabel = document.getElementById('modo-estudo-label');
            const cotidianoLabel = document.getElementById('modo-cotidiano-label');
            if (estudoLabel) estudoLabel.style.color = this.checked ? 'var(--text-muted)' : 'var(--cor-primaria)';
            if (cotidianoLabel) cotidianoLabel.style.color = this.checked ? 'var(--cor-primaria)' : 'var(--text-muted)';
        });
    }
});

// ============================================================
// AUTENTICAÇÃO
// ============================================================
async function entrarNoApp(usuario) {
    usuarioAtual = usuario;
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('app-principal').style.display = 'block';
    const nome = usuario.user_metadata?.full_name || usuario.email?.split('@')[0] || 'Usuário';
    document.getElementById('saudacao-topo').textContent = nome;
    document.getElementById('drawer-usuario').textContent = nome;
    await garantirUsuario(usuario);
    await carregarPreferencias();
    await carregarConversas();
    if (todasConversas.length === 0) {
        await criarNovaConversa();
    } else {
        conversaAtualId = todasConversas[0].id;
        await carregarMensagens(conversaAtualId);
        destacarConversa(conversaAtualId);
    }
}

async function garantirUsuario(usuario) {
    await supabaseClient.from('usuarios').upsert({
        id: usuario.id,
        nome_exibicao: usuario.user_metadata?.full_name || usuario.email?.split('@')[0] || 'Usuário',
        idioma: 'pt'
    }, { onConflict: 'id' });
}

async function carregarPreferencias() {
    const { data } = await supabaseClient
        .from('usuarios')
        .select('idioma')
        .eq('id', usuarioAtual.id)
        .single();
    if (data?.idioma) {
        idiomaAtual = data.idioma;
        document.getElementById('config-idioma').value = idiomaAtual;
        aplicarTraducao();
    }
}

// ============================================================
// EVENTOS DE LOGIN
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('login-btn')?.addEventListener('click', async function() {
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;
        if (!email || !senha) {
            document.getElementById('login-mensagem').textContent = 'Preencha e-mail e senha.';
            return;
        }
        this.disabled = true;
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
        this.disabled = false;
        if (error) {
            document.getElementById('login-mensagem').textContent = error.message;
            return;
        }
        if (data.user) await entrarNoApp(data.user);
    });

    document.getElementById('login-google-btn')?.addEventListener('click', async function() {
        this.disabled = true;
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        this.disabled = false;
        if (error) document.getElementById('login-mensagem').textContent = error.message;
    });

    supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) await entrarNoApp(session.user);
    });

    document.getElementById('btn-sair')?.addEventListener('click', async function() {
        await supabaseClient.auth.signOut();
        location.reload();
    });
});

// ============================================================
// CONVERSAS
// ============================================================
async function carregarConversas() {
    const { data, error } = await supabaseClient
        .from('conversas')
        .select('*')
        .eq('usuario_id', usuarioAtual.id)
        .order('updated_at', { ascending: false });
    if (error) return console.error('Erro ao carregar conversas:', error);
    todasConversas = data || [];
    renderizarConversas();
}

function renderizarConversas() {
    const container = document.getElementById('lista-conversas');
    if (!container) return;
    container.innerHTML = '';
    todasConversas.forEach(conv => {
        const div = document.createElement('div');
        div.className = 'conversa-item' + (conv.id === conversaAtualId ? ' active' : '');
        div.innerHTML = `
            <span>${conv.titulo || 'Nova conversa'}</span>
            <button class="btn-delete-conversa" data-id="${conv.id}"><i class="fas fa-trash-alt"></i></button>
        `;
        div.addEventListener('click', () => alternarConversa(conv.id));
        div.querySelector('.btn-delete-conversa').addEventListener('click', (e) => {
            e.stopPropagation();
            deletarConversa(conv.id);
        });
        container.appendChild(div);
    });
}

function destacarConversa(id) {
    document.querySelectorAll('.conversa-item').forEach(el => {
        el.classList.toggle('active', el.querySelector('.btn-delete-conversa')?.dataset.id === id);
    });
}

async function alternarConversa(id) {
    if (id === conversaAtualId) return;
    conversaAtualId = id;
    await carregarMensagens(id);
    destacarConversa(id);
    await carregarTopicos(id);
}

async function carregarMensagens(conversaId) {
    const container = document.getElementById('chat-mensagens');
    if (!container) return;
    if (mensagensCache[conversaId]) {
        container.innerHTML = mensagensCache[conversaId];
        container.scrollTop = container.scrollHeight;
        return;
    }
    const { data, error } = await supabaseClient
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true });
    if (error) return console.error('Erro ao carregar mensagens:', error);
    container.innerHTML = '';
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="saudacao-container">
                <div class="saudacao-content">
                    <div class="saudacao-icon"><i class="fas fa-star"></i></div>
                    <h1 class="saudacao-titulo">${t('saudacao_titulo')}</h1>
                    <p class="saudacao-subtitulo">${t('saudacao_subtitulo')}</p>
                </div>
            </div>
        `;
    } else {
        data.forEach(msg => {
            const div = document.createElement('div');
            div.className = `mensagem ${msg.tipo === 'user' ? 'usuario' : 'ia'}`;
            div.innerHTML = msg.texto;
            container.appendChild(div);
        });
    }
    mensagensCache[conversaId] = container.innerHTML;
    container.scrollTop = container.scrollHeight;
}

async function criarNovaConversa() {
    const { data, error } = await supabaseClient
        .from('conversas')
        .insert({ usuario_id: usuarioAtual.id, titulo: 'Nova conversa' })
        .select()
        .single();
    if (error) return console.error('Erro ao criar conversa:', error);
    todasConversas.unshift(data);
    renderizarConversas();
    conversaAtualId = data.id;
    mensagensCache[conversaAtualId] = null;
    await carregarMensagens(conversaAtualId);
    destacarConversa(conversaAtualId);
    await carregarTopicos(conversaAtualId);
}

async function deletarConversa(id) {
    const { error } = await supabaseClient
        .from('conversas')
        .delete()
        .eq('id', id)
        .eq('usuario_id', usuarioAtual.id);
    if (error) return console.error('Erro ao deletar conversa:', error);
    todasConversas = todasConversas.filter(c => c.id !== id);
    delete mensagensCache[id];
    renderizarConversas();
    if (id === conversaAtualId) {
        if (todasConversas.length > 0) await alternarConversa(todasConversas[0].id);
        else await criarNovaConversa();
    }
}

// ============================================================
// TÓPICOS
// ============================================================
async function carregarTopicos(conversaId) {
    const container = document.getElementById('lista-topicos');
    if (!container) return;
    const id = Number(conversaId);
    if (isNaN(id)) {
        container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px;">ID inválido.</div>';
        return;
    }
    const { data, error } = await supabaseClient
        .from('mensagens')
        .select('texto')
        .eq('conversa_id', id)
        .eq('tipo', 'user')
        .order('created_at', { ascending: false })
        .limit(20);
    container.innerHTML = '';
    if (error) {
        console.error('Erro ao carregar tópicos:', error);
        container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px;">Erro ao carregar tópicos.</div>';
        return;
    }
    if (!data || data.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px;">Nenhum tópico ainda.</div>';
        return;
    }
    data.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'topico-item';
        div.textContent = msg.texto.substring(0, 50) + (msg.texto.length > 50 ? '...' : '');
        container.appendChild(div);
    });
}

// ============================================================
// ENVIAR MENSAGEM
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btn-chat-enviar')?.addEventListener('click', enviarMensagem);
    document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensagem();
        }
    });
});

async function enviarMensagem() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const texto = input.value.trim();
    if (!texto || !conversaAtualId) return;
    input.value = '';

    const container = document.getElementById('chat-mensagens');
    if (!container) return;
    const saudacao = container.querySelector('.saudacao-container');
    if (saudacao) saudacao.remove();

    const msgUser = document.createElement('div');
    msgUser.className = 'mensagem usuario';
    msgUser.textContent = texto;
    container.appendChild(msgUser);
    container.scrollTop = container.scrollHeight;

    await supabaseClient.from('mensagens').insert({
        conversa_id: conversaAtualId,
        tipo: 'user',
        texto: texto
    });

    const conv = todasConversas.find(c => c.id === conversaAtualId);
    if (conv && conv.titulo === 'Nova conversa') {
        const titulo = texto.substring(0, 30) + (texto.length > 30 ? '...' : '');
        await supabaseClient.from('conversas').update({ titulo }).eq('id', conversaAtualId);
        conv.titulo = titulo;
        renderizarConversas();
    }

    await carregarTopicos(conversaAtualId);
    await chamarIA(texto);
}

// ============================================================
// CHAMAR IA (COM HISTÓRICO COMPLETO E PROMPTS MELHORADOS)
// ============================================================
async function chamarIA(pergunta) {
    const container = document.getElementById('chat-mensagens');
    if (!container) return;

    const indicator = document.createElement('div');
    indicator.className = 'digitando-indicator';
    indicator.innerHTML = `<span>SiriusLearn</span><span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;

    try {
        const modoSelect = document.getElementById('modo-select');
        const modo = modoSelect ? modoSelect.value : 'smart';
        const modoPai = modoPaiAtual;

        // ========= PROMPT MODO ESTUDO =========
        let promptBase = '';
        if (modoPai === 'estudo') {
            promptBase = `Você é o SiriusLearn, tutor virtual especializado em estudos, no modo ESTUDO.

**REGRAS OBRIGATÓRIAS:**
1. Seja didático, aprofundado e use exemplos teóricos. Responda com clareza e organização.
2. Sempre que possível, relacione o conteúdo com aplicações práticas ou exercícios.
3. Use títulos (<h4> ou <h5>), listas (<ul>), negritos (<strong>) e itálicos (<em>) para facilitar a leitura.
4. NUNCA use Markdown – apenas HTML inline.
5. Ao final, sugira um exercício ou pergunta para fixação.

**Exemplo de estrutura:**
<h4>Título do tópico</h4>
<p>Explicação clara e objetiva.</p>
<ul>
  <li><strong>Ponto 1:</strong> detalhe</li>
  <li><strong>Ponto 2:</strong> detalhe</li>
</ul>
<em>Exemplo prático: ...</em>
<br>
<strong>Exercício:</strong> ...`;
        }
        // ========= PROMPT MODO COTIDIANO (SEM PERGUNTAS DE VOLTA) =========
        else {
            promptBase = `Você é o SiriusLearn, assistente prático e direto, no modo COTIDIANO.

**REGRAS ABSOLUTAS (NUNCA QUEBRE):**
1. Responda à pergunta do usuário de forma COMPLETA e DIRETA na PRIMEIRA mensagem.
2. NUNCA faça perguntas de volta, a menos que a pergunta seja literalmente "me ajuda" ou "não sei o que perguntar".
3. NUNCA pergunte "Quer que eu compare?", "Posso ajudar com mais algo?", "Como posso ajudar?" ou similares.
4. Se a pergunta for sobre um produto (ex: "vale a pena comprar X?"), dê uma análise com prós, contras, opinião e recomendações. Termine com uma sugestão prática, mas SEM perguntar se a pessoa quer mais ajuda.
5. Use HTML inline: <strong> para negrito, <em> para itálico, <ul> e <li> para listas, <br> para quebras.
6. NUNCA use Markdown.

**EXEMPLO DE RESPOSTA PROIBIDA:**
❌ "Quer que eu compare com outro modelo?"
❌ "Como posso ajudar?"
❌ "Precisa de mais informações?"

**EXEMPLO DE RESPOSTA CORRETA:**
✅ "Aqui está minha análise sobre o Echo Dot 8... (prós, contras, opinião). Se quiser, você mesmo pode pesquisar comparativos no YouTube."

**Lembre-se:** você é útil, direto e não faz perguntas de volta.`;
        }

        const submodoMap = {
            smart: 'Responda de forma inteligente e equilibrada.',
            deeper: 'Pense profundamente, mostre raciocínio passo a passo.',
            learn: 'Ensine como se fosse um tutor, com exemplos e analogias.',
            search: 'Faça uma pesquisa concisa e traga fontes confiáveis.',
            pratico: 'Dê soluções práticas e aplicáveis imediatamente.',
            inspire: 'Inspire com ideias criativas e motivacionais.',
            explique: 'Explique de forma simples e clara, como para um leigo.',
            liste: 'Organize a resposta em listas ou tópicos.'
        };

        const promptFinal = `${promptBase} ${submodoMap[modo] || ''} Responda em ${idiomaAtual === 'pt' ? 'português' : idiomaAtual === 'en' ? 'inglês' : 'espanhol'}.`;

        // ============================================================
        // BUSCA HISTÓRICO COMPLETO (user + assistant)
        // ============================================================
        const historico = await getHistoricoConversa(conversaAtualId);

        // Monta messages com histórico + pergunta atual
        const messages = [
            { role: 'system', content: promptFinal },
            ...historico,
            { role: 'user', content: pergunta }
        ];

        // ============================================================
        // CHAMADA À API (URL E MODELO CORRETOS)
        // ============================================================
        const response = await fetch('/api/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages,
                model: 'openai/gpt-oss-120b',
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API retornou status ${response.status}: ${errorText}`);
        }

        indicator.remove();

        const msgIA = document.createElement('div');
        msgIA.className = 'mensagem ia';
        container.appendChild(msgIA);
        container.scrollTop = container.scrollHeight;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let respostaCompleta = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const json = line.substring(6);
                    if (json === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(json);
                        const delta = parsed.choices?.[0]?.delta?.content || '';
                        if (delta) {
                            respostaCompleta += delta;
                            msgIA.innerHTML = formatarResposta(respostaCompleta);
                            container.scrollTop = container.scrollHeight;
                        }
                    } catch (e) { /* ignorar erros de parse */ }
                }
            }
        }

        await supabaseClient.from('mensagens').insert({
            conversa_id: conversaAtualId,
            tipo: 'assistant',
            texto: respostaCompleta
        });

        mensagensCache[conversaAtualId] = null;

    } catch (error) {
        console.error('Erro na IA:', error);
        indicator.remove();
        const erroDiv = document.createElement('div');
        erroDiv.className = 'mensagem ia';
        erroDiv.textContent = '❌ Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.';
        container.appendChild(erroDiv);
    }
}

// ============================================================
// FUNÇÃO HISTÓRICO (CORRIGIDA – busca user e assistant)
// ============================================================
async function getHistoricoConversa(conversaId) {
    const { data, error } = await supabaseClient
        .from('mensagens')
        .select('tipo, texto')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true })   // mais antiga primeiro
        .limit(20);   // últimas 20 mensagens

    if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
    }

    // Converte para o formato esperado pela API
    return data?.map(m => ({
        role: m.tipo === 'user' ? 'user' : 'assistant',
        content: m.texto
    })) || [];
}

function formatarResposta(texto) {
    // Se a IA já gerar HTML, complementa apenas markdown simples
    return texto
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/^### (.*?)$/gm, '<h4>$1</h4>')
        .replace(/^## (.*?)$/gm, '<h5>$1</h5>');
}

// ============================================================
// CONFIGURAÇÕES, DRAWER E TIMER
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Configurações
    document.getElementById('config-idioma')?.addEventListener('change', async function() {
        idiomaAtual = this.value;
        await supabaseClient.from('usuarios').update({ idioma: idiomaAtual }).eq('id', usuarioAtual.id);
        aplicarTraducao();
        if (conversaAtualId) {
            mensagensCache[conversaAtualId] = null;
            await carregarMensagens(conversaAtualId);
        }
    });

    document.getElementById('btn-editar-nome')?.addEventListener('click', async function() {
        const novoNome = prompt('Digite seu novo nome:');
        if (!novoNome) return;
        await supabaseClient.from('usuarios').update({ nome_exibicao: novoNome }).eq('id', usuarioAtual.id);
        document.getElementById('saudacao-topo').textContent = novoNome;
        document.getElementById('drawer-usuario').textContent = novoNome;
    });

    document.getElementById('btn-alterar-senha')?.addEventListener('click', async function() {
        const email = prompt('Digite seu e-mail para redefinir a senha:');
        if (!email) return;
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
        alert(error ? 'Erro: ' + error.message : 'E-mail de redefinição enviado!');
    });

    // Drawer
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawer-overlay');
    document.getElementById('btn-menu-toggle')?.addEventListener('click', () => {
        drawer.classList.add('open');
        overlay.classList.add('show');
    });
    document.getElementById('btn-close-drawer')?.addEventListener('click', fecharDrawer);
    overlay?.addEventListener('click', fecharDrawer);

    function fecharDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
    }

    document.querySelectorAll('.drawer-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(`tab-${tab}`)?.classList.add('active');
            document.querySelectorAll('.drawer-item').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            fecharDrawer();
        });
    });

    document.getElementById('btn-nova-conversa')?.addEventListener('click', criarNovaConversa);
    document.getElementById('btn-nova-conversa-drawer')?.addEventListener('click', criarNovaConversa);

    // Timer
    let timerInterval = null;
    let segundos = 0;
    let estudando = false;
    document.getElementById('btn-iniciar')?.addEventListener('click', function() {
        if (estudando) return;
        estudando = true;
        segundos = 0;
        timerInterval = setInterval(() => {
            segundos++;
            const mins = String(Math.floor(segundos / 60)).padStart(2, '0');
            const secs = String(segundos % 60).padStart(2, '0');
            document.getElementById('timer').textContent = `${mins}:${secs}`;
            document.getElementById('timer-progress').style.width = Math.min((segundos / 3600) * 100, 100) + '%';
        }, 1000);
        this.disabled = true;
        document.getElementById('btn-finalizar').disabled = false;
    });
    document.getElementById('btn-finalizar')?.addEventListener('click', function() {
        if (!estudando) return;
        estudando = false;
        clearInterval(timerInterval);
        this.disabled = true;
        document.getElementById('btn-iniciar').disabled = false;
        document.getElementById('pos-estudo-area').style.display = 'block';
    });
});

console.log('🚀 SiriusLearn iniciado com sucesso!');

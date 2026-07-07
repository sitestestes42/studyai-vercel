// ============================================================
// CONFIGURAÇÃO SUPABASE
// No início do arquivo script.js
const SUPABASE_URL = 'https://vpihrpqvzrmixxdrqwbj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ucBzmjp0Xbwi7Z-RHsk4Yg_LydKnMMZ';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// VARIÁVEIS GLOBAIS
// ============================================================
let usuarioAtual = null;
let conversaAtualId = null;
let todasConversas = [];
let mensagensCache = {};
let modoPaiAtual = 'estudo'; // 'estudo' ou 'cotidiano'
let idiomaAtual = 'pt';
let isDigitando = false;
let streamController = null;

// ============================================================
// TRADUÇÕES
// ============================================================
const traducoes = {
    pt: {
        // Login
        login_subtitle: 'Sua IA de estudos',
        login_entrar: 'Entrar',
        login_google: 'Entrar com Google',
        login_cadastro: 'Criar conta',
        login_recuperar: 'Esqueci a senha',
        // Top bar
        btn_nova: 'Nova',
        // Drawer
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
        // Chat
        chat_status: 'Online',
        chat_placeholder_estudo: 'Digite sua pergunta sobre estudos...',
        chat_placeholder_cotidiano: 'Digite sua pergunta sobre o dia a dia...',
        // Saudação
        saudacao_titulo: 'Olá!',
        saudacao_subtitulo: 'Como posso ajudar você hoje?',
        // Modos (estudo)
        modo_smart: '🧠 Smart',
        modo_deeper: '🔬 Think Deeper',
        modo_learn: '📚 Estude e Aprenda',
        modo_search: '🌐 Pesquisar',
        // Modos (cotidiano)
        modo_pratico: '⚡ Prático',
        modo_inspire: '💡 Inspire-se',
        modo_explique: '📝 Explique',
        modo_liste: '📋 Liste',
        // Estudo
        estudo_titulo: 'Sessão de Estudo',
        estudo_subtitulo: 'Foque, estude e no final a IA gera flashcards e quiz.',
        estudo_iniciar: 'Iniciar',
        estudo_finalizar: 'Finalizar',
        pos_estudo_titulo: 'O que você estudou?',
        pos_gerar: 'Gerar Flashcards e Quiz',
        // Flashcards
        flashcards_titulo: 'Flashcards',
        flashcards_subtitulo: 'Revisão espaçada – revise hoje!',
        // Redação
        redacao_titulo: 'Corretor de Redação',
        redacao_subtitulo: 'Cole sua redação e receba correção estilo ENEM.',
        redacao_corrigir: 'Corrigir Redação',
        // Vestibulinho
        vest_titulo: 'Vestibulinho',
        vest_subtitulo: '20 questões geradas por IA.',
        vest_gerar: 'Gerar Simulado',
        // Grupo
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
        // Aulas
        aulas_titulo: 'Aulas',
        aulas_subtitulo: 'Playlists do YouTube para estudar.',
        aulas_add_titulo: 'Adicionar Aula',
        aulas_add_btn: 'Adicionar',
        // Relatórios
        rel_titulo: 'Relatórios',
        rel_subtitulo: 'Acompanhe sua evolução.',
        rel_total: 'Minutos totais',
        rel_sessoes: 'Sessões',
        rel_flashcards: 'Flashcards',
        rel_racha: 'Dias seguidos',
        // Configurações
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

// ============================================================
// FUNÇÕES DE TRADUÇÃO
// ============================================================
function t(chave) {
    return traducoes[idiomaAtual]?.[chave] || chave;
}

function aplicarTraducao() {
    // Login
    document.getElementById('login-subtitle').textContent = t('login_subtitle');
    document.getElementById('login-btn-text').textContent = t('login_entrar');
    document.getElementById('login-google-text').textContent = t('login_google');
    document.getElementById('link-cadastro').textContent = t('login_cadastro');
    document.getElementById('link-recuperar').textContent = t('login_recuperar');

    // Top bar
    document.getElementById('btn-nova-text').textContent = t('btn_nova');

    // Drawer
    document.getElementById('drawer-conversas-titulo').textContent = t('drawer_conversas');
    document.getElementById('drawer-nova-conv').textContent = t('drawer_nova_conv');
    document.getElementById('drawer-topicos-titulo').textContent = t('drawer_topicos');
    document.getElementById('drawer-ferramentas-titulo').textContent = t('drawer_ferramentas');
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
    document.getElementById('chat-status-text').textContent = t('chat_status');
    document.getElementById('saudacao-titulo').textContent = t('saudacao_titulo');
    document.getElementById('saudacao-subtitulo').textContent = t('saudacao_subtitulo');
    atualizarPlaceholderChat();

    // Modos (submodos) - serão atualizados pelo toggle
    atualizarModos();

    // Estudo
    document.getElementById('estudo-titulo').textContent = t('estudo_titulo');
    document.getElementById('estudo-subtitulo').textContent = t('estudo_subtitulo');
    document.getElementById('estudo-iniciar').textContent = t('estudo_iniciar');
    document.getElementById('estudo-finalizar').textContent = t('estudo_finalizar');
    document.getElementById('pos-estudo-titulo').textContent = t('pos_estudo_titulo');
    document.getElementById('pos-gerar').textContent = t('pos_gerar');

    // Flashcards
    document.getElementById('flashcards-titulo').textContent = t('flashcards_titulo');
    document.getElementById('flashcards-subtitulo').textContent = t('flashcards_subtitulo');

    // Redação
    document.getElementById('redacao-titulo').textContent = t('redacao_titulo');
    document.getElementById('redacao-subtitulo').textContent = t('redacao_subtitulo');
    document.getElementById('redacao-corrigir').textContent = t('redacao_corrigir');

    // Vestibulinho
    document.getElementById('vest-titulo').textContent = t('vest_titulo');
    document.getElementById('vest-subtitulo').textContent = t('vest_subtitulo');
    document.getElementById('vest-gerar').textContent = t('vest_gerar');

    // Grupo
    document.getElementById('grupo-titulo').textContent = t('grupo_titulo');
    document.getElementById('grupo-subtitulo').textContent = t('grupo_subtitulo');
    document.getElementById('grupo-criar-titulo').textContent = t('grupo_criar_titulo');
    document.getElementById('grupo-criar-btn').textContent = t('grupo_criar_btn');
    document.getElementById('grupo-entrar-titulo').textContent = t('grupo_entrar_titulo');
    document.getElementById('grupo-entrar-btn').textContent = t('grupo_entrar_btn');
    document.getElementById('grupo-sair-btn').textContent = t('grupo_sair_btn');
    document.getElementById('grupo-membros-titulo').textContent = t('grupo_membros_titulo');
    document.getElementById('grupo-ranking-titulo').textContent = t('grupo_ranking_titulo');
    document.getElementById('grupo-ranking-semanal').textContent = t('grupo_ranking_semanal');
    document.getElementById('grupo-ranking-mensal').textContent = t('grupo_ranking_mensal');
    document.getElementById('grupo-chat-titulo').textContent = t('grupo_chat_titulo');

    // Aulas
    document.getElementById('aulas-titulo').textContent = t('aulas_titulo');
    document.getElementById('aulas-subtitulo').textContent = t('aulas_subtitulo');
    document.getElementById('aulas-add-titulo').textContent = t('aulas_add_titulo');
    document.getElementById('aulas-add-btn').textContent = t('aulas_add_btn');

    // Relatórios
    document.getElementById('rel-titulo').textContent = t('rel_titulo');
    document.getElementById('rel-subtitulo').textContent = t('rel_subtitulo');
    document.getElementById('rel-total-label').textContent = t('rel_total');
    document.getElementById('rel-sessoes-label').textContent = t('rel_sessoes');
    document.getElementById('rel-flashcards-label').textContent = t('rel_flashcards');
    document.getElementById('rel-racha-label').textContent = t('rel_racha');

    // Configurações
    document.getElementById('config-titulo').textContent = t('config_titulo');
    document.getElementById('config-subtitulo').textContent = t('config_subtitulo');
    document.getElementById('config-idioma-titulo').textContent = t('config_idioma_titulo');
    document.getElementById('config-idioma-desc').textContent = t('config_idioma_desc');
    document.getElementById('config-conta-titulo').textContent = t('config_conta_titulo');
    document.getElementById('config-conta-desc').textContent = t('config_conta_desc');
    document.getElementById('config-editar-nome').textContent = t('config_editar_nome');
    document.getElementById('config-alterar-senha').textContent = t('config_alterar_senha');

    // Idiomas do select
    document.getElementById('idioma-label').textContent = idiomaAtual.toUpperCase();
}

function atualizarPlaceholderChat() {
    const input = document.getElementById('chat-input');
    if (modoPaiAtual === 'estudo') {
        input.placeholder = t('chat_placeholder_estudo');
    } else {
        input.placeholder = t('chat_placeholder_cotidiano');
    }
}

// ============================================================
// ALTERNADOR DE MODO PAI (ESTUDO / COTIDIANO)
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

// Evento do toggle
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('toggle-modo-pai');
    toggle.addEventListener('change', function() {
        modoPaiAtual = this.checked ? 'cotidiano' : 'estudo';
        atualizarModos();
        // Atualizar labels do toggle
        document.getElementById('modo-estudo-label').style.color = this.checked ? 'var(--text-muted)' : 'var(--cor-primaria)';
        document.getElementById('modo-cotidiano-label').style.color = this.checked ? 'var(--cor-primaria)' : 'var(--text-muted)';
    });
});

// ============================================================
// LOGIN E AUTENTICAÇÃO
// ============================================================
async function entrarNoApp(usuario) {
    usuarioAtual = usuario;
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('app-principal').style.display = 'block';
    
    // Atualizar nome
    const nome = usuario.user_metadata?.full_name || usuario.email?.split('@')[0] || 'Usuário';
    document.getElementById('saudacao-topo').textContent = nome;
    document.getElementById('drawer-usuario').textContent = nome;
    
    // Verificar/inserir na tabela usuarios
    await garantirUsuario(usuario);
    
    // Carregar preferências
    await carregarPreferencias();
    
    // Carregar conversas
    await carregarConversas();
    
    // Iniciar nova conversa se não houver
    if (todasConversas.length === 0) {
        await criarNovaConversa();
    } else {
        conversaAtualId = todasConversas[0].id;
        await carregarMensagens(conversaAtualId);
        destacarConversa(conversaAtualId);
    }
}

async function garantirUsuario(usuario) {
    const { data, error } = await supabase
        .from('usuarios')
        .upsert({
            id: usuario.id,
            nome_exibicao: usuario.user_metadata?.full_name || usuario.email?.split('@')[0] || 'Usuário',
            idioma: 'pt'
        }, { onConflict: 'id' });
    
    if (error) console.error('Erro ao garantir usuário:', error);
}

async function carregarPreferencias() {
    const { data, error } = await supabase
        .from('usuarios')
        .select('idioma')
        .eq('id', usuarioAtual.id)
        .single();
    
    if (data?.idioma) {
        idiomaAtual = data.idioma;
        document.getElementById('config-idioma').value = idiomaAtual;
        document.getElementById('idioma-label').textContent = idiomaAtual.toUpperCase();
        aplicarTraducao();
    }
}

// Login com email
document.getElementById('login-btn').addEventListener('click', async function() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    if (!email || !senha) {
        document.getElementById('login-mensagem').textContent = 'Preencha e-mail e senha.';
        return;
    }
    this.disabled = true;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    this.disabled = false;
    if (error) {
        document.getElementById('login-mensagem').textContent = error.message;
        return;
    }
    if (data.user) {
        await entrarNoApp(data.user);
    }
});

// Login com Google
document.getElementById('login-google-btn').addEventListener('click', async function() {
    this.disabled = true;
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    this.disabled = false;
    if (error) {
        document.getElementById('login-mensagem').textContent = error.message;
    }
});

// Verificar sessão ao carregar
supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
        await entrarNoApp(session.user);
    }
});

// Sair
document.getElementById('btn-sair').addEventListener('click', async function() {
    await supabase.auth.signOut();
    location.reload();
});

// ============================================================
// CONVERSAS
// ============================================================
async function carregarConversas() {
    const { data, error } = await supabase
        .from('conversas')
        .select('*')
        .eq('usuario_id', usuarioAtual.id)
        .order('updated_at', { ascending: false });
    
    if (error) {
        console.error('Erro ao carregar conversas:', error);
        return;
    }
    
    todasConversas = data || [];
    renderizarConversas();
}

function renderizarConversas() {
    const container = document.getElementById('lista-conversas');
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
    // Atualizar tópicos
    await carregarTopicos(id);
}

async function carregarMensagens(conversaId) {
    const container = document.getElementById('chat-mensagens');
    
    // Se já estiver em cache, usar
    if (mensagensCache[conversaId]) {
        container.innerHTML = mensagensCache[conversaId];
        return;
    }
    
    const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('Erro ao carregar mensagens:', error);
        return;
    }
    
    container.innerHTML = '';
    if (!data || data.length === 0) {
        // Mostrar saudação
        container.innerHTML = `
            <div class="saudacao-container" id="saudacao-container">
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
            div.className = `mensagem ${msg.role === 'user' ? 'usuario' : 'ia'}`;
            div.innerHTML = msg.content;
            container.appendChild(div);
        });
    }
    
    // Salvar cache
    mensagensCache[conversaId] = container.innerHTML;
    container.scrollTop = container.scrollHeight;
}

async function criarNovaConversa() {
    const { data, error } = await supabase
        .from('conversas')
        .insert({
            usuario_id: usuarioAtual.id,
            titulo: 'Nova conversa'
        })
        .select()
        .single();
    
    if (error) {
        console.error('Erro ao criar conversa:', error);
        return;
    }
    
    todasConversas.unshift(data);
    renderizarConversas();
    conversaAtualId = data.id;
    mensagensCache[conversaAtualId] = null;
    await carregarMensagens(conversaAtualId);
    destacarConversa(conversaAtualId);
    await carregarTopicos(conversaAtualId);
}

async function deletarConversa(id) {
    const { error } = await supabase
        .from('conversas')
        .delete()
        .eq('id', id)
        .eq('usuario_id', usuarioAtual.id);
    
    if (error) {
        console.error('Erro ao deletar conversa:', error);
        return;
    }
    
    todasConversas = todasConversas.filter(c => c.id !== id);
    delete mensagensCache[id];
    renderizarConversas();
    
    if (id === conversaAtualId) {
        if (todasConversas.length > 0) {
            await alternarConversa(todasConversas[0].id);
        } else {
            await criarNovaConversa();
        }
    }
}

// ============================================================
// TÓPICOS DA CONVERSA
// ============================================================
async function carregarTopicos(conversaId) {
    const container = document.getElementById('lista-topicos');
    const { data, error } = await supabase
        .from('mensagens')
        .select('content')
        .eq('conversa_id', conversaId)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(20);
    
    container.innerHTML = '';
    if (error || !data || data.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px;">Nenhum tópico ainda.</div>';
        return;
    }
    
    data.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'topico-item';
        const texto = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
        div.textContent = texto;
        container.appendChild(div);
    });
}

// ============================================================
// ENVIAR MENSAGEM
// ============================================================
document.getElementById('btn-chat-enviar').addEventListener('click', enviarMensagem);
document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
    }
});

async function enviarMensagem() {
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto || !conversaAtualId) return;
    input.value = '';
    
    // Adicionar mensagem do usuário
    const container = document.getElementById('chat-mensagens');
    const saudacao = container.querySelector('.saudacao-container');
    if (saudacao) saudacao.remove();
    
    const msgUser = document.createElement('div');
    msgUser.className = 'mensagem usuario';
    msgUser.textContent = texto;
    container.appendChild(msgUser);
    container.scrollTop = container.scrollHeight;
    
    // Salvar no Supabase
    await supabase.from('mensagens').insert({
        conversa_id: conversaAtualId,
        role: 'user',
        content: texto
    });
    
    // Atualizar título da conversa se for a primeira
    if (todasConversas.find(c => c.id === conversaAtualId)?.titulo === 'Nova conversa') {
        const titulo = texto.substring(0, 30) + (texto.length > 30 ? '...' : '');
        await supabase.from('conversas')
            .update({ titulo })
            .eq('id', conversaAtualId);
        todasConversas.find(c => c.id === conversaAtualId).titulo = titulo;
        renderizarConversas();
    }
    
    // Atualizar tópicos
    await carregarTopicos(conversaAtualId);
    
    // Chamar IA
    await chamarIA(texto);
}

async function chamarIA(pergunta) {
    const container = document.getElementById('chat-mensagens');
    
    // Indicador de digitação
    const indicator = document.createElement('div');
    indicator.className = 'digitando-indicator';
    indicator.innerHTML = `
        <span>SiriusLearn</span>
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
    `;
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
    
    try {
        const modo = document.getElementById('modo-select').value;
        const modoPai = modoPaiAtual;
        
        // Determinar prompt baseado no modo pai
        let promptBase = '';
        if (modoPai === 'estudo') {
            promptBase = 'Você é o SiriusLearn no modo ESTUDO. Seja didático, aprofundado e use exemplos teóricos. Responda com clareza e organização.';
        } else {
            promptBase = 'Você é o SiriusLearn no modo COTIDIANO. Seja prático, direto e use exemplos da vida real. Foque em soluções acionáveis.';
        }
        
        // Adicionar específico do submodo
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
        
        // Chamar API
        const response = await fetch('/api/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: promptFinal },
                    ...(await getHistoricoConversa(conversaAtualId))
                ],
                model: 'openai/gpt-oss-120b',
                stream: true
            })
        });
        
        if (!response.ok) throw new Error('Erro na API');
        
        // Remover indicador
        indicator.remove();
        
        // Criar mensagem da IA
        const msgIA = document.createElement('div');
        msgIA.className = 'mensagem ia';
        container.appendChild(msgIA);
        container.scrollTop = container.scrollHeight;
        
        // Ler stream
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
                    } catch (e) {}
                }
            }
        }
        
        // Salvar resposta no Supabase
        await supabase.from('mensagens').insert({
            conversa_id: conversaAtualId,
            role: 'assistant',
            content: respostaCompleta
        });
        
        // Atualizar cache
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

async function getHistoricoConversa(conversaId) {
    const { data } = await supabase
        .from('mensagens')
        .select('role, content')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true })
        .limit(10);
    return data?.map(m => ({ role: m.role, content: m.content })) || [];
}

function formatarResposta(texto) {
    // Formatação básica (markdown simplificado)
    return texto
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/^### (.*?)$/gm, '<h4>$1</h4>')
        .replace(/^## (.*?)$/gm, '<h5>$1</h5>');
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================
document.getElementById('config-idioma').addEventListener('change', async function() {
    idiomaAtual = this.value;
    document.getElementById('idioma-label').textContent = idiomaAtual.toUpperCase();
    await supabase.from('usuarios')
        .update({ idioma: idiomaAtual })
        .eq('id', usuarioAtual.id);
    aplicarTraducao();
    // Recarregar mensagens para traduzir saudação
    if (conversaAtualId) {
        mensagensCache[conversaAtualId] = null;
        await carregarMensagens(conversaAtualId);
    }
});

document.getElementById('btn-editar-nome').addEventListener('click', async function() {
    const novoNome = prompt('Digite seu novo nome:');
    if (!novoNome) return;
    await supabase.from('usuarios')
        .update({ nome_exibicao: novoNome })
        .eq('id', usuarioAtual.id);
    document.getElementById('saudacao-topo').textContent = novoNome;
    document.getElementById('drawer-usuario').textContent = novoNome;
});

document.getElementById('btn-alterar-senha').addEventListener('click', async function() {
    const email = prompt('Digite seu e-mail para redefinir a senha:');
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
        alert('Erro: ' + error.message);
    } else {
        alert('E-mail de redefinição enviado!');
    }
});

// ============================================================
// NAVEGAÇÃO DO DRAWER
// ============================================================
document.getElementById('btn-menu-toggle').addEventListener('click', () => {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawer-overlay').classList.add('show');
});

document.getElementById('btn-close-drawer').addEventListener('click', fecharDrawer);
document.getElementById('drawer-overlay').addEventListener('click', fecharDrawer);

function fecharDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('show');
}

// Botões do drawer
document.querySelectorAll('.drawer-item').forEach(btn => {
    btn.addEventListener('click', function() {
        const tab = this.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        document.querySelectorAll('.drawer-item').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        fecharDrawer();
    });
});

// Botões nova conversa
document.getElementById('btn-nova-conversa').addEventListener('click', criarNovaConversa);
document.getElementById('btn-nova-conversa-drawer').addEventListener('click', criarNovaConversa);

// ============================================================
// TIMER DE ESTUDO
// ============================================================
let timerInterval = null;
let segundos = 0;
let estudando = false;

document.getElementById('btn-iniciar').addEventListener('click', function() {
    if (estudando) return;
    estudando = true;
    segundos = 0;
    timerInterval = setInterval(() => {
        segundos++;
        const mins = String(Math.floor(segundos / 60)).padStart(2, '0');
        const secs = String(segundos % 60).padStart(2, '0');
        document.getElementById('timer').textContent = `${mins}:${secs}`;
        // Progresso (máx 1h)
        const progress = Math.min((segundos / 3600) * 100, 100);
        document.getElementById('timer-progress').style.width = `${progress}%`;
    }, 1000);
    this.disabled = true;
    document.getElementById('btn-finalizar').disabled = false;
});

document.getElementById('btn-finalizar').addEventListener('click', function() {
    if (!estudando) return;
    estudando = false;
    clearInterval(timerInterval);
    this.disabled = true;
    document.getElementById('btn-iniciar').disabled = false;
    document.getElementById('pos-estudo-area').style.display = 'block';
});

// ============================================================
// INICIALIZAÇÃO
// ============================================================
console.log('🚀 SiriusLearn iniciado!');

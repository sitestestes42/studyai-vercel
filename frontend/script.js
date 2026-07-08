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
// TRADUÇÕES (apenas trecho reduzido para não alongar)
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
    en: { /* ... omitido para brevidade, mas pode copiar do código anterior */ },
    es: { /* ... omitido */ }
};

function t(chave) {
    return traducoes[idiomaAtual]?.[chave] || chave;
}

function aplicarTraducao() {
    // Função reduzida – você pode usar a anterior
    // (Apenas para encurtar, mantenha a que você já tinha)
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
// TÓPICOS (corrigido)
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
// ENVIAR MENSAGEM (corrigido)
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
// CHAMAR IA (corrigido – inclui pergunta e usa /api/groq)
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

        let promptBase = '';
        if (modoPai === 'estudo') {
            promptBase = 'Você é o SiriusLearn no modo ESTUDO. Seja didático, aprofundado e use exemplos teóricos. Responda com clareza e organização.';
        } else {
            promptBase = 'Você é o SiriusLearn no modo COTIDIANO. Seja prático, direto e use exemplos da vida real. Foque em soluções acionáveis.';
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

        // Busca histórico (mensagens anteriores)
        const historico = await getHistoricoConversa(conversaAtualId);

        // Monta mensagens: system + histórico + pergunta atual
        const messages = [
            { role: 'system', content: promptFinal },
            ...historico,
            { role: 'user', content: pergunta }
        ];

        // URL CORRETA: /api/groq (não /api/qroq)
        const response = await fetch('/api/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages,
                model: 'llama-3.1-70b-versatile',
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

async function getHistoricoConversa(conversaId) {
    const { data } = await supabaseClient
        .from('mensagens')
        .select('tipo, texto')
        .eq('conversa_id', conversaId)
        .eq('tipo', 'user')
        .order('created_at', { ascending: true })
        .limit(10);
    return data?.map(m => ({ role: m.tipo, content: m.texto })) || [];
}

function formatarResposta(texto) {
    return texto
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/^### (.*?)$/gm, '<h4>$1</h4>')
        .replace(/^## (.*?)$/gm, '<h5>$1</h5>');
}

// ============================================================
// DEMAIS FUNÇÕES (Configurações, Drawer, Timer)
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

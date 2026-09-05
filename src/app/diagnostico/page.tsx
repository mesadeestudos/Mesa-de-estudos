'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, RefreshCw } from 'lucide-react';

const niveis = [
  { value: 'INICIANTE', label: 'Iniciante' },
  { value: 'INTERMEDIARIO', label: 'Intermediário' },
  { value: 'AVANCADO', label: 'Avançado' },
];

const dificuldades = [
  { value: 'CONSTANCIA', label: 'Constância' },
  { value: 'TEORIA', label: 'Teoria' },
  { value: 'REVISAO', label: 'Revisão' },
  { value: 'QUESTOES', label: 'Questões' },
  { value: 'TEMPO', label: 'Tempo' },
];

export default function DiagnosticoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nivelAtual: 'INICIANTE',
    diasAteProva: '',
    estudouEditalAntes: false,
    dificuldadePrincipal: 'CONSTANCIA',
    preferenciaSessao: 'MEDIA',
    materiasTemidas: '',
    objetivo: '',
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [estrategia, setEstrategia] = useState('');

  useEffect(() => {
    fetch('/api/diagnostico')
      .then(res => res.json())
      .then(data => {
        if (data.diagnostico) {
          setForm({
            nivelAtual: data.diagnostico.nivelAtual,
            diasAteProva: data.diagnostico.diasAteProva?.toString() ?? '',
            estudouEditalAntes: data.diagnostico.estudouEditalAntes,
            dificuldadePrincipal: data.diagnostico.dificuldadePrincipal,
            preferenciaSessao: data.diagnostico.preferenciaSessao,
            materiasTemidas: data.diagnostico.materiasTemidas.join(', '),
            objetivo: data.diagnostico.objetivo ?? '',
          });
        }
        setEstrategia(data.estrategia ?? '');
      })
      .catch(() => setErro('Não foi possível carregar o diagnóstico.'))
      .finally(() => setCarregando(false));
  }, []);

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          diasAteProva: form.diasAteProva ? Number(form.diasAteProva) : null,
          materiasTemidas: form.materiasTemidas.split(',').map(item => item.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível salvar o diagnóstico.');
      router.push('/ciclos');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar o diagnóstico.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_42%,#ecfdf5_100%)] px-4 py-8 text-slate-800">
      <section className="mx-auto max-w-4xl rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/60">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">Diagnóstico inicial</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Calibrar sua orientação inteligente</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">{estrategia || 'Responda para ajustar ritmo, foco e recomendações.'}</p>

        {carregando ? (
          <div className="mt-8 flex items-center gap-3 text-sm font-black text-sky-600"><RefreshCw className="animate-spin" size={18} /> Carregando...</div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Select label="Nível atual" value={form.nivelAtual} options={niveis} onChange={nivelAtual => setForm(prev => ({ ...prev, nivelAtual }))} />
            <Input label="Dias até a prova" value={form.diasAteProva} type="number" onChange={diasAteProva => setForm(prev => ({ ...prev, diasAteProva }))} />
            <Select label="Maior dificuldade" value={form.dificuldadePrincipal} options={dificuldades} onChange={dificuldadePrincipal => setForm(prev => ({ ...prev, dificuldadePrincipal }))} />
            <Select label="Sessões preferidas" value={form.preferenciaSessao} options={[{ value: 'CURTA', label: 'Curtas' }, { value: 'MEDIA', label: 'Médias' }, { value: 'LONGA', label: 'Longas' }]} onChange={preferenciaSessao => setForm(prev => ({ ...prev, preferenciaSessao }))} />
            <Input label="Matérias que você teme" value={form.materiasTemidas} placeholder="Separe por vírgula" onChange={materiasTemidas => setForm(prev => ({ ...prev, materiasTemidas }))} />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
              <input type="checkbox" checked={form.estudouEditalAntes} onChange={e => setForm(prev => ({ ...prev, estudouEditalAntes: e.target.checked }))} />
              Já estudei esse edital antes
            </label>
            <label className="md:col-span-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Objetivo</span>
              <textarea value={form.objetivo} onChange={e => setForm(prev => ({ ...prev, objetivo: e.target.value }))} className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-sky-500" placeholder="Ex.: quero chegar competitivo em 90 dias." />
            </label>
            {erro && <p className="md:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{erro}</p>}
            <button onClick={salvar} disabled={salvando} className="md:col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white disabled:opacity-60">
              {salvando ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Salvar diagnóstico e montar ciclo
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label><span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span><input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-sky-500" /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <label><span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span><select value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-sky-500">{options.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
}

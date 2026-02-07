
import React, { useState, useEffect, useCallback } from 'react';
import { PhoneIcon, WhatsAppIcon, TelegramIcon, CheckIcon } from './components/Icons';
import Modal from './components/Modal';
import { calculateCost, getPricePerExtraMeter } from './services/calculator';
import { WindowType, CalculationParams, FormData, ModalState } from './types';

const App: React.FC = () => {
  // --- States ---
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: null });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [calcParams, setCalcParams] = useState<CalculationParams>({
    length: 2.0,
    type: WindowType.Straight,
    corners: 0
  });
  const [currentPrice, setCurrentPrice] = useState(0);

  // Form States
  const [formsData, setFormsData] = useState<{ [key: string]: FormData }>({
    calcForm: { name: '', phone: '', comment: '', consent: false },
    consultation: { name: '', phone: '', comment: '', consent: false },
    callRequest: { name: '', phone: '', comment: '', consent: false }
  });
  const [formStatus, setFormStatus] = useState<{ [key: string]: 'idle' | 'sending' | 'success' }>({
    calcForm: 'idle',
    consultation: 'idle',
    callRequest: 'idle'
  });

  // --- Effects ---
  useEffect(() => {
    setCurrentPrice(calculateCost(calcParams.length, calcParams.type, calcParams.corners));
  }, [calcParams]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // --- Handlers ---
  const handleCalcChange = (field: keyof CalculationParams, value: any) => {
    setCalcParams(prev => ({ ...prev, [field]: value }));
  };

  const handleFormChange = (formId: string, field: keyof FormData, value: any) => {
    setFormsData(prev => ({
      ...prev,
      [formId]: { ...prev[formId], [field]: value }
    }));
  };

  const validatePhone = (phone: string) => {
    return phone.replace(/\D/g, '').length >= 10;
  };

  const buildTelegramMessage = (formId: string, data: FormData) => {
    const formNameMap: Record<string, string> = {
      calcForm: 'Получить смету (калькулятор)',
      consultation: 'Консультация',
      callRequest: 'Заказать звонок',
    };

    const lines: string[] = [];
    lines.push(`🟢 Новая заявка: ${formNameMap[formId] || formId}`);
    if (data.name) lines.push(`Имя: ${data.name}`);
    lines.push(`Телефон: ${data.phone}`);

    if (formId === 'calcForm') {
      const typeLabel: Record<string, string> = {
        [WindowType.Straight]: 'Прямой',
        [WindowType.Angled]: 'Угловой',
        [WindowType.Bay]: 'Эркерный',
        [WindowType.Arc]: 'Дуговой',
      };
      lines.push('---');
      lines.push(`Калькулятор:`);
      lines.push(`Длина: ${calcParams.length} м`);
      lines.push(`Тип: ${typeLabel[calcParams.type] || String(calcParams.type)}`);
      if (calcParams.type === WindowType.Angled) lines.push(`Углы: ${calcParams.corners}`);
      lines.push(`Цена: ${currentPrice.toLocaleString('ru-RU')} ₽`);
    }

    if (data.comment) {
      lines.push('---');
      lines.push(`Комментарий: ${data.comment}`);
    }

    return lines.join('\n');
  };

  const submitForm = async (formId: string) => {
    const data = formsData[formId];
    if (!validatePhone(data.phone) || !data.consent) return;

    setFormStatus(prev => ({ ...prev, [formId]: 'sending' }));

    try {
      const payload = {
        formId,
        message: buildTelegramMessage(formId, data),
      };

      const res = await fetch('/.netlify/functions/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }

      setFormStatus(prev => ({ ...prev, [formId]: 'success' }));

      // Reset after 5 seconds
      setTimeout(() => {
        setFormStatus(prev => ({ ...prev, [formId]: 'idle' }));
        handleFormChange(formId, 'name', '');
        handleFormChange(formId, 'phone', '');
        handleFormChange(formId, 'comment', '');
      }, 5000);
    } catch (e: any) {
      console.error('Telegram send error:', e);
      alert('Не удалось отправить заявку. Проверьте настройки Telegram (TELEGRAM_BOT_TOKEN) на хостинге и попробуйте ещё раз.');
      setFormStatus(prev => ({ ...prev, [formId]: 'idle' }));
    }
  };

  const openModal = (type: 'consent' | 'policy') => setModal({ isOpen: true, type });
  const closeModal = () => setModal({ isOpen: false, type: null });

  // --- Components Helpers ---
  const SectionTitle = ({ children, subtitle }: { children: React.ReactNode, subtitle?: string }) => (
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">{children}</h2>
      {subtitle && <p className="text-slate-400 max-w-2xl mx-auto">{subtitle}</p>}
      <div className="w-20 h-1 bg-emerald-500 mx-auto mt-6 rounded-full"></div>
    </div>
  );

  const LegalLinks = () => (
    <span className="text-xs text-slate-400">
      ✅ Я даю <button type="button" onClick={() => openModal('consent')} className="text-emerald-500 underline hover:text-emerald-400">согласие</button> на обработку персональных данных и подтверждаю ознакомление с <button type="button" onClick={() => openModal('policy')} className="text-emerald-500 underline hover:text-emerald-400">Политикой</button> обработки персональных данных.
    </span>
  );

  return (
    <div className="min-h-screen text-slate-200 selection:bg-emerald-500/30">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-3"
              aria-label="DOMZZZON — на главную"
            >
              <img
                src="/assets/logo_no_bg.png"
                alt="Умный Дом"
                className="h-10 w-auto object-contain"
              />
            </button>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <a href="#advantages" onClick={(e) => { e.preventDefault(); scrollToSection('advantages'); }} className="hover:text-emerald-500 transition-colors">Преимущества</a>
            <a href="#technologies" onClick={(e) => { e.preventDefault(); scrollToSection('technologies'); }} className="hover:text-emerald-500 transition-colors">Технологии</a>
            <a href="#forms" onClick={(e) => { e.preventDefault(); scrollToSection('forms'); }} className="hover:text-emerald-500 transition-colors">Формы окон</a>
            <a href="#calculator" onClick={(e) => { e.preventDefault(); scrollToSection('calculator'); }} className="hover:text-emerald-500 transition-colors">Калькулятор</a>
            <a href="#contacts" onClick={(e) => { e.preventDefault(); scrollToSection('contacts'); }} className="hover:text-emerald-500 transition-colors">Контакты</a>
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-4">
              <a href="https://wa.me/79937725252" className="text-slate-400 hover:text-emerald-500 transition-colors"><WhatsAppIcon className="w-5 h-5" /></a>
              <a href="https://t.me/SmartHomezzz" className="text-slate-400 hover:text-emerald-500 transition-colors"><TelegramIcon className="w-5 h-5" /></a>
              <a href="tel:+79937725252" className="text-white font-bold hover:text-emerald-500 transition-colors">+7 (993) 772-52-52</a>
            </div>
            <button
              type="button"
              onClick={() => scrollToSection('calculator')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20"
            >
              Рассчитать
            </button>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-white p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* MOBILE MENU */}
        {isMenuOpen && (
          <div className="lg:hidden glass-card absolute top-20 left-0 right-0 p-6 flex flex-col gap-4 text-lg border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
            <a href="#advantages" onClick={(e) => { e.preventDefault(); scrollToSection('advantages'); setIsMenuOpen(false); }}>Преимущества</a>
            <a href="#technologies" onClick={(e) => { e.preventDefault(); scrollToSection('technologies'); setIsMenuOpen(false); }}>Технологии</a>
            <a href="#forms" onClick={(e) => { e.preventDefault(); scrollToSection('forms'); setIsMenuOpen(false); }}>Формы окон</a>
            <a href="#calculator" onClick={(e) => { e.preventDefault(); scrollToSection('calculator'); setIsMenuOpen(false); }}>Калькулятор</a>
            <a href="#contacts" onClick={(e) => { e.preventDefault(); scrollToSection('contacts'); setIsMenuOpen(false); }}>Контакты</a>
            <hr className="border-white/10 my-2" />
            <a href="tel:+79937725252" className="text-emerald-500 font-bold">+7 (993) 772-52-52</a>
          </div>
        )}
      </header>

      <main className="pt-20">
        {/* HERO */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden hero-gradient">
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Собственное производство
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1]">
                Будущее комфорта <br /> <span className="gradient-text">в ваших окнах</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-lg">
                Премиальные электрокарнизы под любые формы окон. Профессиональный монтаж по всему Югу России.
              </p>
              
              <ul className="space-y-3">
                {[
                  '5 лет гарантии на мотор и 10 лет на систему',
                  'Бесшумная система до 30 дБ',
                  'Работа от 220В и аккумулятора',
                  'Монтаж: Крым, Адыгея, Краснодарский & Ставропольский край'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-emerald-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => scrollToSection('calculator')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all text-center shadow-xl shadow-emerald-900/20"
                >
                  Рассчитать стоимость
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('calculator')}
                  className="border border-white/10 hover:border-emerald-500/50 bg-white/5 px-8 py-4 rounded-xl text-lg font-bold transition-all text-center"
                >
                  Калькулятор
                </button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative w-full flex items-center justify-center">
                <div className="absolute -inset-10 bg-emerald-500/5 blur-[120px] rounded-full"></div>
                <div className="relative glass-card rounded-3xl overflow-hidden border border-emerald-500/20 shadow-2xl shadow-emerald-900/20 max-w-[520px]">
                  <img
                    src="/assets/motor_with_desc.png"
                    alt="Умный мотор электрокарниза: снижение шума, повышенная мощность, ресурс"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  <div className="p-6 space-y-3">
                    <h3 className="text-xl font-extrabold text-white">Умный мотор</h3>
                    <p className="text-sm text-slate-400">
                      Спиральный редуктор, технология снижения шума и плавный ход. Надёжный ресурс и защита питания.
                    </p>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Шум: −30%</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Мощность: +30%</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Ресурс: 66 000+ циклов</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ADVANTAGES */}
        <section id="advantages" className="py-24 bg-slate-950">
          <div className="container mx-auto px-4">
            <SectionTitle subtitle="Почему выбирают DOMZZZON для своего Умного Дома">Преимущества</SectionTitle>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Абсолютно тихо', text: 'Уровень шума до 30 дБ — тише, чем шепот в библиотеке.', icon: '🤫' },
                { title: 'Долгая гарантия', text: '5 лет на мотор и 10 лет на направляющие системы.', icon: '🛡️' },
                { title: 'Любые формы', text: 'Прямые, угловые, эркерные и радиусные окна любой сложности.', icon: '📐' },
                { title: 'Умное управление', text: 'Пульт, приложение, голосовой помощник (Алиса, Siri).', icon: '📱' },
                { title: 'Монтаж под ключ', text: 'Сделаем замер, изготовим и установим за один визит.', icon: '🛠️' },
                { title: 'Сервис 24/7', text: 'Всегда на связи для обслуживания и консультаций.', icon: '📞' },
                { title: 'Прочность', text: 'Выдерживают тяжелые портьеры весом до 70 кг.', icon: '💪' },
                { title: 'Питание на выбор', text: 'Работа от сети 220В или автономного аккумулятора.', icon: '🔋' },
              ].map((item, i) => (
                <div key={i} className="glass-card p-8 rounded-3xl hover:border-emerald-500/30 transition-all group">
                  <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all scale-100 group-hover:scale-110 duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TECHNOLOGIES */}
        <section id="technologies" className="py-24 relative">
          <div className="container mx-auto px-4">
            <SectionTitle>Технологии</SectionTitle>
            
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="glass-card p-8 rounded-3xl">
                  <h3 className="text-2xl font-bold text-emerald-500 mb-4">Управление</h3>
                  <p className="text-slate-300 mb-4">Управляйте атмосферой в доме так, как удобно вам:</p>
                  <ul className="grid grid-cols-2 gap-4">
                    {['Радиопульт', 'Настенная кнопка', 'Приложение на смартфоне', 'Голосовое управление', 'Сценарии умного дома', 'Ручной запуск (Touch Motion)'].map((t, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-card p-8 rounded-3xl">
                  <h3 className="text-2xl font-bold text-emerald-500 mb-4">Направляющие</h3>
                  <p className="text-slate-300">Алюминиевый профиль с полимерным покрытием для идеально плавного скольжения.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="glass-card p-8 rounded-3xl">
                  <h3 className="text-2xl font-bold text-emerald-500 mb-4">Типы моторов</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white mb-2">Проводной 220В</h4>
                      <p className="text-xs text-slate-400">Для этапа ремонта. Не требует зарядки, всегда готов к работе.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white mb-2">Аккумуляторный</h4>
                      <p className="text-xs text-slate-400">Если ремонт уже закончен. Заряда хватает на 6-8 месяцев работы.</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-8 rounded-3xl">
                  <h3 className="text-2xl font-bold text-emerald-500 mb-4">Для любых штор</h3>
                  <p className="text-slate-300">Легкий тюль, тяжелые портьеры или двойные системы (день/ночь). Наш мотор справится с нагрузкой до 70 кг.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WINDOW FORMS */}
        <section id="forms" className="py-24 bg-slate-950">
          <div className="container mx-auto px-4">
            <SectionTitle subtitle="Мы производим карнизы абсолютно любой геометрии">Формы окон</SectionTitle>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Прямая', desc: 'Классическое решение для стандартных проемов.' },
                { title: 'Угол 90°', desc: 'Для угловых окон и зонирования помещений.' },
                { title: 'Угол 135°', desc: 'Идеально для сложных планировок и эркеров.' },
                { title: 'П-образная', desc: 'Для панорамного остекления в 3 стороны.' },
                { title: 'Эркер', desc: 'Многоугольные формы с плавными переходами.' },
                { title: 'Полукруг/Радиус', desc: 'Для самых эффектных дизайнерских окон.' },
              ].map((item, i) => (
                <div key={i} className="glass-card overflow-hidden rounded-3xl group cursor-default">
                  <div className="h-40 bg-white/5 flex items-center justify-center p-8 group-hover:bg-emerald-500/10 transition-colors">
                     {/* Dynamic Abstract Shape SVG */}
                     <svg className="w-full h-full text-emerald-500/40 group-hover:text-emerald-500 transition-all duration-500" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="3">
                        {i === 0 && <line x1="10" y1="30" x2="90" y2="30" />}
                        {i === 1 && <path d="M20 10 L20 40 L60 40" />}
                        {i === 2 && <path d="M10 40 L40 40 L70 20" />}
                        {i === 3 && <path d="M10 10 L10 40 L80 40 L80 10" />}
                        {i === 4 && <path d="M10 20 L30 40 L70 40 L90 20" />}
                        {i === 5 && <path d="M10 50 Q50 0 90 50" />}
                     </svg>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CALCULATOR & FORM */}
        <section id="calculator" className="py-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[150px] rounded-full -mr-48"></div>
          <div className="container mx-auto px-4">
            <SectionTitle subtitle="Быстрый расчет стоимости по вашим параметрам">Калькулятор стоимости</SectionTitle>
            
            <div className="grid lg:grid-cols-5 gap-8 items-start">
              {/* Calc Inputs */}
              <div className="lg:col-span-3 glass-card p-8 rounded-3xl space-y-8">
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-400 block uppercase tracking-wider">Длина (L), метров</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        step="0.1" 
                        value={calcParams.length}
                        onChange={(e) => handleCalcChange('length', parseFloat(e.target.value))}
                        className="flex-1 accent-emerald-500"
                      />
                      <input 
                        type="number" 
                        min="1" 
                        step="0.1"
                        value={calcParams.length}
                        onChange={(e) => handleCalcChange('length', parseFloat(e.target.value) || 1)}
                        className="w-20 bg-slate-800 border border-white/10 rounded-lg p-2 text-center text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-400 block uppercase tracking-wider">Тип системы</label>
                    <select 
                      value={calcParams.type}
                      onChange={(e) => handleCalcChange('type', e.target.value as WindowType)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={WindowType.Straight}>Прямой</option>
                      <option value={WindowType.Angled}>Угловой</option>
                      <option value={WindowType.Bay}>Эркерный</option>
                      <option value={WindowType.Arc}>Дуговой (Радиусный)</option>
                    </select>
                  </div>
                </div>

                {calcParams.type === WindowType.Angled && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-bold text-slate-400 block uppercase tracking-wider">Количество углов (U)</label>
                    <div className="flex gap-4">
                      {[0, 1, 2, 3, 4, 5].map(num => (
                        <button 
                          key={num}
                          onClick={() => handleCalcChange('corners', num)}
                          className={`w-12 h-12 rounded-xl border transition-all font-bold ${calcParams.corners === num ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-800 border-white/10 text-slate-400 hover:border-emerald-500/50'}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-slate-400 font-medium">Предварительный итог:</span>
                      <span className="text-4xl md:text-5xl font-black text-white">{currentPrice.toLocaleString('ru-RU')} ₽</span>
                   </div>
                   <div className="text-xs text-slate-500 border-t border-white/5 pt-4">
                      * Первый метр 7500 ₽. Доп. метр {getPricePerExtraMeter(calcParams.type)} ₽.
                      {calcParams.type === WindowType.Angled && ` Углы: ${calcParams.corners} x 1500 ₽.`}
                      Расчёт не является публичной офертой и может измениться после замера.
                   </div>
                </div>
              </div>

              {/* Form Integrated with Calc */}
              <div className="lg:col-span-2 glass-card p-8 rounded-3xl space-y-6">
                <h3 className="text-2xl font-bold text-white">Получить смету</h3>
                <p className="text-slate-400 text-sm">Оставьте заявку, и мы закрепим за вами рассчитанную стоимость.</p>
                
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Ваше имя" 
                    value={formsData.calcForm.name}
                    onChange={(e) => handleFormChange('calcForm', 'name', e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <input 
                    type="tel" 
                    placeholder="+7 (___) ___-__-__" 
                    value={formsData.calcForm.phone}
                    onChange={(e) => handleFormChange('calcForm', 'phone', e.target.value)}
                    className={`w-full bg-slate-800 border rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 ${formsData.calcForm.phone && !validatePhone(formsData.calcForm.phone) ? 'border-red-500/50' : 'border-white/10'}`}
                  />
                  
                  <div className="flex gap-2 items-start pt-2">
                    <input 
                      id="consent-calc" 
                      type="checkbox" 
                      checked={formsData.calcForm.consent}
                      onChange={(e) => handleFormChange('calcForm', 'consent', e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500" 
                    />
                    <label htmlFor="consent-calc" className="leading-none">
                      <LegalLinks />
                    </label>
                  </div>

                  <button 
                    disabled={!formsData.calcForm.consent || formStatus.calcForm === 'sending' || formStatus.calcForm === 'success'}
                    onClick={() => submitForm('calcForm')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-emerald-900/20"
                  >
                    {formStatus.calcForm === 'idle' && 'Отправить заявку'}
                    {formStatus.calcForm === 'sending' && 'Отправка...'}
                    {formStatus.calcForm === 'success' && 'Спасибо! Свяжемся с вами'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONSULTATION FORMS (TABS) */}
        <section className="py-24 bg-slate-950">
          <div className="container mx-auto px-4">
             <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12">
                   {/* Consultation */}
                   <div className="space-y-6">
                      <h3 className="text-3xl font-bold text-white">Консультация</h3>
                      <p className="text-slate-400">Нужна помощь в выборе или планировании системы? Наши специалисты ответят на все вопросы.</p>
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          placeholder="Ваше имя" 
                          value={formsData.consultation.name}
                          onChange={(e) => handleFormChange('consultation', 'name', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500" 
                        />
                        <input 
                          type="tel" 
                          placeholder="Ваш телефон" 
                          value={formsData.consultation.phone}
                          onChange={(e) => handleFormChange('consultation', 'phone', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500" 
                        />
                        <textarea 
                          placeholder="Ваш вопрос" 
                          rows={3}
                          value={formsData.consultation.comment}
                          onChange={(e) => handleFormChange('consultation', 'comment', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500"
                        ></textarea>
                        <div className="flex gap-2 items-start">
                          <input 
                            id="cons-box" 
                            type="checkbox" 
                            checked={formsData.consultation.consent}
                            onChange={(e) => handleFormChange('consultation', 'consent', e.target.checked)}
                            className="mt-1 w-4 h-4" 
                          />
                          <label htmlFor="cons-box"><LegalLinks /></label>
                        </div>
                        <button 
                          disabled={!formsData.consultation.consent || formStatus.consultation !== 'idle'}
                          onClick={() => submitForm('consultation')}
                          className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-4 rounded-xl transition-all"
                        >
                          {formStatus.consultation === 'success' ? 'Заявка принята' : 'Получить консультацию'}
                        </button>
                      </div>
                   </div>

                   {/* Call Request */}
                   <div className="space-y-6">
                      <h3 className="text-3xl font-bold text-white">Заказать звонок</h3>
                      <p className="text-slate-400">Мы перезвоним вам в удобное время и обсудим ваш проект.</p>
                      <div className="space-y-4">
                        <input 
                          type="tel" 
                          placeholder="Ваш телефон" 
                          value={formsData.callRequest.phone}
                          onChange={(e) => handleFormChange('callRequest', 'phone', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500" 
                        />
                        <input 
                          type="text" 
                          placeholder="Удобное время для звонка" 
                          value={formsData.callRequest.comment}
                          onChange={(e) => handleFormChange('callRequest', 'comment', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500" 
                        />
                        <div className="flex gap-2 items-start">
                          <input 
                            id="call-box" 
                            type="checkbox" 
                            checked={formsData.callRequest.consent}
                            onChange={(e) => handleFormChange('callRequest', 'consent', e.target.checked)}
                            className="mt-1 w-4 h-4" 
                          />
                          <label htmlFor="call-box"><LegalLinks /></label>
                        </div>
                        <button 
                          disabled={!formsData.callRequest.consent || formStatus.callRequest !== 'idle'}
                          onClick={() => submitForm('callRequest')}
                          className="w-full border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500 font-bold py-4 rounded-xl transition-all"
                        >
                          {formStatus.callRequest === 'success' ? 'Ждите звонка' : 'Перезвоните мне'}
                        </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <SectionTitle>Частые вопросы</SectionTitle>
            
            <div className="space-y-4">
              {[
                { q: 'Насколько шумный мотор?', a: 'Наши системы работают с уровнем шума до 30 дБ. В реальных условиях это практически не слышно — вы почувствуете только движение штор.' },
                { q: 'Какая гарантия на изделия?', a: 'Мы даем 5 лет честной гарантии на электропривод и 10 лет на механическую часть системы.' },
                { q: 'Что делать, если уже сделан ремонт?', a: 'Мы устанавливаем аккумуляторные модели, которые не требуют прокладки кабеля. Зарядки хватает на полгода-год работы.' },
                { q: 'Можно ли подключить к Яндекс.Алисе?', a: 'Да, наши карнизы легко интегрируются во все современные системы умного дома, включая Алису, Siri, Google Home.' },
                { q: 'Какие сроки изготовления?', a: 'От замера до монтажа обычно проходит 3–7 рабочих дней.' },
                { q: 'Устанавливаете ли вы в других городах?', a: 'Мы работаем по всему Краснодарскому краю, Крыму, Адыгее и Ставрополью.' }
              ].map((item, i) => (
                <details key={i} className="glass-card rounded-2xl group overflow-hidden">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-white group-open:text-emerald-500">
                    {item.q}
                    <span className="text-emerald-500 transition-transform group-open:rotate-180">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="p-6 pt-0 text-slate-400 border-t border-white/5 animate-in slide-in-from-top-2">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACTS */}
        <section id="contacts" className="py-24 bg-slate-950 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <SectionTitle subtitle="Свяжитесь с нами любым удобным способом">Контакты</SectionTitle>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <PhoneIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Телефон</h4>
                      <a href="tel:+79937725252" className="text-xl text-slate-300 hover:text-emerald-500 transition-colors">+7 (993) 772-52-52</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">География</h4>
                      <p className="text-slate-400">Новороссийск (офис/производство). Выезд по Краснодарскому краю, Крыму, Адыгее и Ставрополью.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <a href="https://wa.me/79937725252" className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-bold transition-all">
                    <WhatsAppIcon className="w-6 h-6" /> WhatsApp
                  </a>
                  <a href="https://t.me/SmartHomezzz" className="flex-1 flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 text-white p-4 rounded-xl font-bold transition-all">
                    <TelegramIcon className="w-6 h-6" /> Telegram
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-12 glass-card border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div className="space-y-4">
              <img src="/assets/logo_no_bg.png" alt="Умный Дом" className="h-10 w-auto object-contain" />
              <p className="text-sm text-slate-500 max-w-xs">
                Ваш эксперт в автоматизации оконного пространства. 
                Премиальное качество и безупречный сервис.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-xs tracking-widest">Документация</h4>
                <ul className="space-y-2">
                  <li><button onClick={() => openModal('consent')} className="text-sm text-slate-400 hover:text-emerald-500 transition-colors">Согласие на обработку ПДн</button></li>
                  <li><button onClick={() => openModal('policy')} className="text-sm text-slate-400 hover:text-emerald-500 transition-colors">Политика обработки ПДн</button></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-xs tracking-widest">Контакты</h4>
                <ul className="space-y-2">
                  <li><a href="tel:+79937725252" className="text-sm text-slate-400 hover:text-emerald-500 transition-colors">+7 (993) 772-52-52</a></li>
                  <li className="text-sm text-slate-400">г. Новороссийск</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs text-slate-600 uppercase tracking-widest">
            <p>© 2025 DOMZZZON. Все права защищены.</p>
            <p className="text-center">Оператор: ИП Краснопёрова В.М., ОГРНИП 322237500455750, ИНН 027411817323</p>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <Modal 
        isOpen={modal.isOpen && modal.type === 'consent'} 
        onClose={closeModal} 
        title="СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ"
      >
        <p>Я, пользователь сайта «Умный Дом», отправляя данные через формы «Рассчитать стоимость», «Консультация», «Калькулятор», «Заказать звонок», даю согласие оператору персональных данных:</p>
        <p className="font-bold">ИП Краснопёрова В.М.<br/>ОГРНИП: 322237500455750<br/>ИНН: 027411817323</p>
        <p>на обработку моих персональных данных: имя, номер телефона, а также сведения, указанные мною в комментарии/тексте заявки.</p>

        <h4 className="font-bold text-white">Цели обработки:</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>расчёт стоимости услуг (калькулятор/расчёт),</li>
          <li>консультация по услугам,</li>
          <li>обратный звонок/связь для уточнения деталей,</li>
          <li>организация замера и монтажа электрокарнизов, подготовка и согласование заказа.</li>
        </ul>

        <p>Действия с персональными данными: сбор, запись, систематизация, накопление, хранение, уточнение (обновление/изменение), использование, удаление, уничтожение.</p>
        <p>Связь: я согласен(на) на получение звонков и сообщений в мессенджеры WhatsApp и Telegram исключительно для обработки моей заявки и уточнения деталей заказа.</p>
        <p>Срок обработки: до достижения указанных целей обработки и не дольше срока, необходимого для их достижения.</p>
        <p>Отзыв согласия: согласие может быть отозвано мною в любое время путём направления уведомления оператору по контактам, указанным в Политике обработки персональных данных. В случае отзыва согласия оператор прекращает обработку и уничтожает персональные данные, если отсутствуют иные законные основания для их обработки.</p>
      </Modal>

      <Modal 
        isOpen={modal.isOpen && modal.type === 'policy'} 
        onClose={closeModal} 
        title="ПОЛИТИКА В ОТНОШЕНИИ ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ"
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-white mb-2">1. Общие положения</h4>
            <p>Настоящая Политика определяет порядок обработки и защиты персональных данных пользователей сайта «Умный Дом».</p>
            <p>Оператор персональных данных: ИП Краснопёрова В.М., ОГРНИП 322237500455750, ИНН 027411817323.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">2. Какие данные мы обрабатываем</h4>
            <p>Мы можем обрабатывать следующие персональные данные, предоставляемые пользователем:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>имя;</li>
              <li>номер телефона;</li>
              <li>сведения, указанные пользователем в тексте заявки/комментариях (например, параметры заказа, адрес/район и иные данные, которые пользователь сообщает добровольно).</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">3. Цели обработки</h4>
            <p>Персональные данные обрабатываются исключительно для:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>расчёта стоимости услуг (калькулятор/расчёт);</li>
              <li>предоставления консультации;</li>
              <li>обратной связи, включая звонок и переписку для уточнения деталей заявки;</li>
              <li>организации замера и монтажа электрокарнизов, подготовки и согласования заказа.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">4. Правовые основания обработки</h4>
            <p>Обработка осуществляется на основании согласия пользователя, выраженного путём проставления отметки (чекбокса) при отправке форм на сайте.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">5. Условия обработки и передача третьим лицам</h4>
            <p>Оператор не передаёт персональные данные третьим лицам и не поручает их обработку третьим лицам, за исключением случаев, предусмотренных законодательством РФ.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">6. Сроки обработки и хранение</h4>
            <p>Персональные данные обрабатываются и хранятся до достижения целей обработки и не дольше срока, необходимого для их достижения, после чего подлежат удалению/уничтожению.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">7. Меры защиты персональных данных</h4>
            <p>Оператор применяет необходимые организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">8. Права пользователя</h4>
            <p>Пользователь вправе:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>получать информацию о своей обработке персональных данных;</li>
              <li>требовать уточнения, блокирования или уничтожения данных при наличии оснований;</li>
              <li>отозвать согласие на обработку персональных данных.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">9. Как отозвать согласие и обратиться к оператору</h4>
            <p>Для отзыва согласия и по вопросам обработки персональных данных пользователь может направить обращение оператору по контактам, размещённым на сайте в разделе «Контакты» (или в реквизитах оператора).</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">10. Изменение Политики</h4>
            <p>Оператор вправе обновлять настоящую Политику. Актуальная версия всегда размещается на сайте.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;

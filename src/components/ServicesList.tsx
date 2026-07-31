import React, { useState } from 'react';
import { Scissors, Sparkles, Crown, Smile, Palette, Star, Clock, Check, Calendar } from 'lucide-react';
import { BarberService } from '../types';
import { formatPrice, toPersianDigits } from '../utils/jalali';

interface ServicesListProps {
  services: BarberService[];
  onSelectServiceToBook: (service: BarberService) => void;
}

export const ServicesList: React.FC<ServicesListProps> = ({ services, onSelectServiceToBook }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'همه خدمات' },
    { id: 'hair', label: 'اصلاح سر و فید' },
    { id: 'beard', label: 'اصلاح ریش' },
    { id: 'skin', label: 'فیشیال و پوست' },
    { id: 'package', label: 'پکیج‌های ترکیبی' },
    { id: 'vip', label: 'خدمات VIP داماد' },
  ];

  const filtered = activeCategory === 'all'
    ? services
    : services.filter(s => s.category === activeCategory);

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'beard': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'package': return <Crown className="w-5 h-5 text-amber-400" />;
      case 'skin': return <Smile className="w-5 h-5 text-amber-400" />;
      case 'vip': return <Star className="w-5 h-5 text-amber-400" />;
      default: return <Scissors className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-3 sm:px-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-amber-950/40 border border-zinc-800 rounded-2xl p-6 text-right relative overflow-hidden">
        <div className="max-w-xl relative z-10">
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block mb-3">
            تعرفه و شفافیت قیمت پیرایش امیر
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-2">
            لیست جامع خدمات و قیمت‌های آنلاین
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            تمامی خدمات با بهترین ابزار، مواد بهداشتی استریل و بالاترین کیفیت توسط استادکاران مجرب ارائه می‌گردد.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 scale-105'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                    {getIcon(s.category)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-100">{s.name}</h3>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>مدت زمان: {toPersianDigits(s.duration)} دقیقه</span>
                    </span>
                  </div>
                </div>

                <span className="font-extrabold text-amber-400 text-sm whitespace-nowrap bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                  {formatPrice(s.price)}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mt-3 mb-4">
                {s.description}
              </p>
            </div>

            <button
              onClick={() => onSelectServiceToBook(s)}
              className="w-full bg-zinc-950 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 font-bold py-2.5 px-4 rounded-xl text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-2 group-hover:border-amber-400"
            >
              <Calendar className="w-4 h-4" />
              <span>رزرو این خدمت</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

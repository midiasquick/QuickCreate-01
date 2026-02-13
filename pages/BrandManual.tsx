import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BrandBlock, BrandBlockType } from '../types';
import { 
    BookOpen, Edit3, Plus, Trash2, Type, Image as ImageIcon, 
    Palette, Download, MoveUp, MoveDown, Save, 
    Heading, AlignLeft, Upload, Info, AlertTriangle, Lightbulb,
    Link as LinkIcon, ExternalLink, Minus, X, FileText
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';

export const BrandManual: React.FC = () => {
    const { config, updateConfig } = useApp();
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'ADMIN';

    // Local state for the editor
    const [isEditing, setIsEditing] = useState(false);
    const [blocks, setBlocks] = useState<BrandBlock[]>(config.brandManual || []);

    const handleSaveManual = () => {
        updateConfig({ brandManual: blocks });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setBlocks(config.brandManual || []); // Revert
        setIsEditing(false);
    };

    const addBlock = (type: BrandBlockType) => {
        const newBlock: BrandBlock = {
            id: `blk_${Date.now()}`,
            type,
            content: 
                type === 'COLOR_PALETTE' ? { colors: [{ hex: '#000000', name: 'Black' }] } :
                type === 'INFO_BOX' ? { style: 'INFO', text: 'Conteúdo da nota.', subText: 'Título da Nota' } :
                type === 'LINK_GROUP' ? { links: [{ id: Date.now().toString(), label: 'Novo Link', url: 'https://' }] } :
                type === 'DIVIDER' ? { style: 'SOLID' } :
                {}
        };
        setBlocks([...blocks, newBlock]);
    };

    const updateBlockContent = (id: string, newContent: any) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, content: { ...b.content, ...newContent } } : b));
    };

    const deleteBlock = (id: string) => {
        if(confirm('Tem certeza que deseja remover este bloco?')) {
            setBlocks(blocks.filter(b => b.id !== id));
        }
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const newBlocks = [...blocks];
        if (direction === 'up' && index > 0) {
            [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
        } else if (direction === 'down' && index < newBlocks.length - 1) {
            [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];
        }
        setBlocks(newBlocks);
    };

    const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateBlockContent(id, { imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // --- RENDERERS ---

    const renderViewMode = () => (
        <div className="max-w-4xl mx-auto space-y-10 py-8 animate-fade-in">
             <div className="text-center mb-12">
                 <div className="inline-flex items-center justify-center p-3 bg-primary-light text-primary rounded-full mb-4">
                     <BookOpen size={32} />
                 </div>
                 <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-2">Manual da Marca</h1>
                 <p className="text-gray-500 max-w-xl mx-auto">Diretrizes oficiais para aplicação de identidade visual da {config.companyName}.</p>
             </div>

             <div className="space-y-12 pb-20">
                {blocks.map(block => {
                    switch (block.type) {
                        case 'HEADER':
                            return <h2 key={block.id} className="text-3xl font-bold text-slate-800 border-b pb-4">{block.content.text}</h2>;
                        case 'PARAGRAPH':
                            return <p key={block.id} className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">{block.content.text}</p>;
                        case 'IMAGE':
                            return (
                                <div key={block.id} className="rounded-xl overflow-hidden border border-gray-100 shadow-lg bg-white">
                                    {block.content.imageUrl ? (
                                        <img src={block.content.imageUrl} alt="Brand Asset" className="w-full h-auto object-contain bg-gray-50 max-h-[600px]" />
                                    ) : (
                                        <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">Sem Imagem Configurada</div>
                                    )}
                                </div>
                            );
                        case 'INFO_BOX':
                            const styleMap = {
                                'INFO': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: Info, iconColor: 'text-blue-500' },
                                'WARNING': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: AlertTriangle, iconColor: 'text-amber-500' },
                                'TIP': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: Lightbulb, iconColor: 'text-emerald-500' },
                            };
                            const st = styleMap[(block.content.style as 'INFO'|'WARNING'|'TIP') || 'INFO'];
                            const Icon = st.icon;
                            return (
                                <div key={block.id} className={`p-6 rounded-lg border ${st.bg} ${st.border} flex items-start space-x-4`}>
                                    <div className={`p-2 bg-white rounded-full shadow-sm shrink-0 ${st.iconColor}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        {block.content.subText && <h4 className={`font-bold text-lg mb-1 ${st.text}`}>{block.content.subText}</h4>}
                                        <p className={`${st.text} opacity-90 leading-relaxed`}>{block.content.text}</p>
                                    </div>
                                </div>
                            );
                        case 'COLOR_PALETTE':
                            return (
                                <div key={block.id} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {block.content.colors?.map((color, idx) => (
                                        <div key={idx} className="group flex flex-col">
                                            <div className="aspect-square rounded-2xl shadow-sm border border-gray-100 mb-3 relative overflow-hidden" style={{ backgroundColor: color.hex }}>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
                                                    <span className="bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-lg">{color.hex}</span>
                                                </div>
                                            </div>
                                            <div className="px-1">
                                                <p className="font-bold text-slate-800 text-lg leading-tight">{color.name}</p>
                                                <p className="text-sm text-gray-500 mt-1">{color.usage}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        case 'TYPOGRAPHY':
                            return (
                                <div key={block.id} className="p-8 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-start gap-8">
                                        <div className="md:w-1/3">
                                            <div className="text-9xl font-bold text-slate-800 mb-4 leading-none opacity-10" style={{ fontFamily: block.content.text }}>Aa</div>
                                            <h3 className="text-2xl font-bold text-slate-800">{block.content.text}</h3>
                                            <p className="text-sm text-gray-500 font-mono mt-2 bg-gray-100 p-2 rounded inline-block">{block.content.subText}</p>
                                        </div>
                                        <div className="md:w-2/3 space-y-6">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Headline 1</p>
                                                <p className="text-4xl font-bold text-slate-900 leading-tight" style={{ fontFamily: block.content.text }}>A rápida raposa marrom pula.</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Headline 2</p>
                                                <p className="text-2xl font-semibold text-slate-800" style={{ fontFamily: block.content.text }}>Sobre a nossa identidade visual.</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Body Text</p>
                                                <p className="text-base text-gray-600 leading-relaxed" style={{ fontFamily: block.content.text }}>
                                                    O corpo do texto deve ser utilizado para descrições longas. A legibilidade é fundamental para garantir que a mensagem da marca seja transmitida com clareza em todos os dispositivos.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        case 'DOWNLOAD':
                            return (
                                <a key={block.id} href="#" onClick={(e) => e.preventDefault()} className="flex items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition group cursor-pointer relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:bg-primary transition-colors"></div>
                                    <div className="p-4 bg-primary-50 text-primary rounded-lg mr-5 group-hover:bg-primary-light transition-colors">
                                        <FileText size={32}/>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{block.content.fileName || 'Arquivo para Download'}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{block.content.fileSize || 'PDF - 1.2MB'}</p>
                                    </div>
                                    <div className="bg-gray-100 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                                        <Download size={20} />
                                    </div>
                                </a>
                            );
                        case 'DIVIDER':
                            const borderStyle = block.content.style === 'DOTTED' ? 'border-dotted' : block.content.style === 'DASHED' ? 'border-dashed' : 'border-solid';
                            return <hr key={block.id} className={`my-8 border-t-2 border-gray-200 ${borderStyle}`} />;
                        case 'LINK_GROUP':
                            return (
                                <div key={block.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {block.content.links?.map((link) => (
                                        <a 
                                            key={link.id} 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-light hover:shadow-md transition group"
                                        >
                                            <div className="bg-primary-50 p-2 rounded-md mr-3 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                <ExternalLink size={20} />
                                            </div>
                                            <span className="font-medium text-slate-700 group-hover:text-primary truncate">{link.label}</span>
                                        </a>
                                    ))}
                                </div>
                            );
                        default:
                            return null;
                    }
                })}
             </div>
        </div>
    );

    const renderEditMode = () => (
        <div className="max-w-5xl mx-auto py-8">
             <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm sticky top-4 z-40 border border-primary-light ring-4 ring-gray-100">
                 <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center"><Edit3 size={18} className="mr-2 text-primary"/> Editor Visual</h2>
                    <p className="text-xs text-gray-500">Arraste para reordenar (use setas) ou edite o conteúdo.</p>
                 </div>
                 <div className="flex space-x-2">
                     <Button variant="secondary" onClick={handleCancel}>Cancelar</Button>
                     <Button variant="success" onClick={handleSaveManual} icon={Save}>Salvar Alterações</Button>
                 </div>
             </div>

             <div className="space-y-6 pb-28">
                {blocks.map((block, index) => (
                    <div key={block.id} className="bg-white border-2 border-slate-200 rounded-xl p-6 relative group transition-all hover:border-primary hover:shadow-lg">
                        {/* Block Controls */}
                        <div className="absolute top-4 right-4 flex space-x-1 opacity-100 bg-white shadow-sm p-1 rounded-lg border border-gray-200 z-20">
                             <span className="px-2 py-1 text-xs font-bold text-gray-400 uppercase border-r border-gray-100 flex items-center">{block.type.replace('_', ' ')}</span>
                             <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-500 hover-text-primary disabled:opacity-30 hover:bg-gray-50 rounded"><MoveUp size={16}/></button>
                             <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length -1} className="p-1.5 text-gray-500 hover-text-primary disabled:opacity-30 hover:bg-gray-50 rounded"><MoveDown size={16}/></button>
                             <div className="w-px bg-gray-200 mx-1"></div>
                             <button onClick={() => deleteBlock(block.id)} className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded transition-colors"><Trash2 size={16}/></button>
                        </div>

                        <div className="pt-8">
                            {/* Header Editor */}
                            {block.type === 'HEADER' && (
                                <Input 
                                    label="Título da Seção" 
                                    icon={Heading}
                                    placeholder="Digite o título da seção..."
                                    value={block.content.text || ''}
                                    onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                                />
                            )}

                            {/* Paragraph Editor */}
                            {block.type === 'PARAGRAPH' && (
                                <Textarea 
                                    label="Texto Corrido"
                                    rows={5}
                                    placeholder="Digite o texto do parágrafo aqui..."
                                    value={block.content.text || ''}
                                    onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                                />
                            )}

                            {/* Info Box Editor */}
                            {block.type === 'INFO_BOX' && (
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wide">Estilo da Nota</label>
                                        <div className="flex space-x-4">
                                            {(['INFO', 'WARNING', 'TIP'] as const).map(style => (
                                                <label key={style} className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all ${block.content.style === style ? 'bg-primary-50 border-primary ring-1 ring-primary' : 'bg-gray-50 border-gray-200 hover:bg-white'}`}>
                                                    <input 
                                                        type="radio" 
                                                        name={`style-${block.id}`}
                                                        checked={block.content.style === style}
                                                        onChange={() => updateBlockContent(block.id, { style })}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-3 h-3 rounded-full ${style === 'INFO' ? 'bg-blue-500' : style === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                                    <span className="text-sm font-bold text-gray-700">{style === 'INFO' ? 'Informativo' : style === 'WARNING' ? 'Aviso' : 'Dica'}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input 
                                            label="Título (Opcional)"
                                            placeholder="Ex: Importante"
                                            value={block.content.subText || ''}
                                            onChange={(e) => updateBlockContent(block.id, { subText: e.target.value })}
                                        />
                                        <div className="md:col-span-2">
                                            <Textarea 
                                                label="Conteúdo"
                                                rows={2}
                                                placeholder="Digite a mensagem..."
                                                value={block.content.text || ''}
                                                onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Divider Editor */}
                            {block.type === 'DIVIDER' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wide">Estilo do Divisor</label>
                                    <div className="flex space-x-4">
                                        {(['SOLID', 'DASHED', 'DOTTED'] as const).map(style => (
                                            <label key={style} className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${block.content.style === style ? 'bg-primary-50 border-primary ring-1 ring-primary' : 'bg-gray-50 border-gray-200 hover:bg-white'}`}>
                                                <input 
                                                    type="radio" 
                                                    name={`divider-${block.id}`}
                                                    checked={block.content.style === style}
                                                    onChange={() => updateBlockContent(block.id, { style })}
                                                    className="hidden"
                                                />
                                                <div className={`w-full h-0 border-t-2 border-slate-400 mb-2 ${style === 'SOLID' ? 'border-solid' : style === 'DASHED' ? 'border-dashed' : 'border-dotted'}`}></div>
                                                <span className="text-xs font-bold text-gray-500">{style === 'SOLID' ? 'Sólido' : style === 'DASHED' ? 'Tracejado' : 'Pontilhado'}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Link Group Editor */}
                            {block.type === 'LINK_GROUP' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wide">Lista de Links</label>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        {(block.content.links || []).map((link, idx) => (
                                            <div key={link.id} className="flex items-center space-x-3 bg-white p-2 rounded shadow-sm border border-gray-100">
                                                <div className="bg-primary-50 p-2 rounded text-primary"><ExternalLink size={16}/></div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <input 
                                                        type="text" 
                                                        className="border-b border-gray-200 focus:border-primary outline-none text-sm py-1 bg-transparent placeholder-gray-400" 
                                                        placeholder="Rótulo (ex: Site Oficial)"
                                                        value={link.label}
                                                        onChange={(e) => {
                                                            const newLinks = [...(block.content.links || [])];
                                                            newLinks[idx] = { ...newLinks[idx], label: e.target.value };
                                                            updateBlockContent(block.id, { links: newLinks });
                                                        }}
                                                    />
                                                    <input 
                                                        type="text" 
                                                        className="border-b border-gray-200 focus:border-primary outline-none text-sm py-1 bg-transparent placeholder-gray-400" 
                                                        placeholder="URL (https://...)"
                                                        value={link.url}
                                                        onChange={(e) => {
                                                            const newLinks = [...(block.content.links || [])];
                                                            newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                                                            updateBlockContent(block.id, { links: newLinks });
                                                        }}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const newLinks = (block.content.links || []).filter((_, i) => i !== idx);
                                                        updateBlockContent(block.id, { links: newLinks });
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                                                    title="Remover link"
                                                >
                                                    <X size={18}/>
                                                </button>
                                            </div>
                                        ))}
                                        <Button variant="ghost" onClick={() => updateBlockContent(block.id, { links: [...(block.content.links || []), { id: Date.now().toString(), label: 'Novo Link', url: 'https://' }] })} icon={Plus} className="w-full border-2 border-dashed border-primary-light text-primary">Adicionar Link</Button>
                                    </div>
                                </div>
                            )}

                            {/* Image Editor */}
                            {block.type === 'IMAGE' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wide">Configuração de Imagem</label>
                                    <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
                                        <div className="w-full md:w-64 h-40 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group/preview">
                                            {block.content.imageUrl ? (
                                                <img src={block.content.imageUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <ImageIcon className="mx-auto text-slate-300 mb-2" size={32}/>
                                                    <span className="text-xs text-slate-400">Preview</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 w-full space-y-4">
                                            <Input 
                                                label="URL da Imagem" 
                                                placeholder="https://exemplo.com/imagem.png"
                                                value={block.content.imageUrl || ''}
                                                onChange={(e) => updateBlockContent(block.id, { imageUrl: e.target.value })}
                                            />
                                            <div>
                                                <span className="text-xs text-gray-500 mb-1 block">Ou envie do computador</span>
                                                <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer w-full md:w-auto justify-center">
                                                    <Upload size={16} className="mr-2 text-primary"/> Selecionar Arquivo
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(block.id, e)} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Color Palette Editor */}
                            {block.type === 'COLOR_PALETTE' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wide">Paleta de Cores</label>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        {(block.content.colors || []).map((color, idx) => (
                                            <div key={idx} className="flex items-center space-x-3 bg-white p-2 rounded shadow-sm border border-gray-100">
                                                <input 
                                                    type="color" 
                                                    className="w-10 h-10 p-0 border-0 rounded cursor-pointer shadow-sm" 
                                                    value={color.hex}
                                                    onChange={(e) => {
                                                        const newColors = [...(block.content.colors || [])];
                                                        newColors[idx] = { ...newColors[idx], hex: e.target.value };
                                                        updateBlockContent(block.id, { colors: newColors });
                                                    }}
                                                />
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <input 
                                                        type="text" 
                                                        className="border-b border-gray-200 focus:border-primary outline-none text-sm py-1 bg-transparent placeholder-gray-400" 
                                                        placeholder="Nome (ex: Azul)"
                                                        value={color.name}
                                                        onChange={(e) => {
                                                            const newColors = [...(block.content.colors || [])];
                                                            newColors[idx] = { ...newColors[idx], name: e.target.value };
                                                            updateBlockContent(block.id, { colors: newColors });
                                                        }}
                                                    />
                                                    <input 
                                                        type="text" 
                                                        className="border-b border-gray-200 focus:border-primary outline-none text-sm py-1 bg-transparent placeholder-gray-400" 
                                                        placeholder="Uso (ex: Botões)"
                                                        value={color.usage || ''}
                                                        onChange={(e) => {
                                                            const newColors = [...(block.content.colors || [])];
                                                            newColors[idx] = { ...newColors[idx], usage: e.target.value };
                                                            updateBlockContent(block.id, { colors: newColors });
                                                        }}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const newColors = (block.content.colors || []).filter((_, i) => i !== idx);
                                                        updateBlockContent(block.id, { colors: newColors });
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                                                    title="Remover cor"
                                                >
                                                    <X size={18}/>
                                                </button>
                                            </div>
                                        ))}
                                        <Button variant="ghost" onClick={() => updateBlockContent(block.id, { colors: [...(block.content.colors || []), { hex: '#000000', name: 'Nova Cor', usage: '' }] })} icon={Plus} className="w-full border-2 border-dashed border-primary-light text-primary">Adicionar Nova Cor</Button>
                                    </div>
                                </div>
                            )}

                             {/* Typography Editor */}
                             {block.type === 'TYPOGRAPHY' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wide">Configuração de Tipografia</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input 
                                            label="Nome da Fonte"
                                            placeholder="Ex: Inter"
                                            value={block.content.text || ''}
                                            onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                                        />
                                        <Input 
                                            label="Descrição / Classificação"
                                            placeholder="Ex: Sans-serif Geometric"
                                            value={block.content.subText || ''}
                                            onChange={(e) => updateBlockContent(block.id, { subText: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-3 flex items-center">
                                        <AlertTriangle size={12} className="mr-1"/>
                                        Nota: Certifique-se que a fonte é web-safe ou está importada no CSS global da aplicação.
                                    </p>
                                </div>
                            )}

                            {/* Download Editor */}
                            {block.type === 'DOWNLOAD' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wide">Arquivo para Download</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <Input 
                                                label="Nome do Arquivo (Exibição)"
                                                placeholder="Ex: Logo Oficial Vetorizado"
                                                value={block.content.fileName || ''}
                                                onChange={(e) => updateBlockContent(block.id, { fileName: e.target.value })}
                                            />
                                        </div>
                                        <Input 
                                            label="Tamanho/Formato"
                                            placeholder="Ex: PDF - 5MB"
                                            value={block.content.fileSize || ''}
                                            onChange={(e) => updateBlockContent(block.id, { fileSize: e.target.value })}
                                        />
                                    </div>
                                    <div className="mt-3">
                                        <Input 
                                            label="Link de Download (URL)"
                                            placeholder="https://..."
                                            value={block.content.text || ''}
                                            onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
             </div>

             {/* Add Block Toolbar - Fixed Bottom */}
             <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white py-3 px-6 rounded-full shadow-2xl flex items-center space-x-4 z-50 hover:scale-105 transition-transform border border-slate-700/50">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Adicionar Bloco</span>
                <div className="h-4 w-px bg-slate-700"></div>
                <button onClick={() => addBlock('HEADER')} className="flex flex-col items-center group" title="Título">
                    <div className="p-2 group-hover:bg-primary rounded-full transition-colors"><Heading size={20}/></div>
                </button>
                <button onClick={() => addBlock('PARAGRAPH')} className="flex flex-col items-center group" title="Texto">
                    <div className="p-2 group-hover:bg-primary rounded-full transition-colors"><AlignLeft size={20}/></div>
                </button>
                <button onClick={() => addBlock('IMAGE')} className="flex flex-col items-center group" title="Imagem">
                    <div className="p-2 group-hover:bg-primary rounded-full transition-colors"><ImageIcon size={20}/></div>
                </button>
                <button onClick={() => addBlock('INFO_BOX')} className="flex flex-col items-center group" title="Nota/Aviso">
                    <div className="p-2 group-hover:bg-primary rounded-full transition-colors"><Info size={20}/></div>
                </button>
                <button onClick={() => addBlock('LINK_GROUP')} className="flex flex-col items-center group" title="Links">
                    <div className="p-2 group-hover:bg-primary rounded-full transition-colors"><LinkIcon size={20}/></div>
                </button>
                <button onClick={() => addBlock('DIVIDER')} className="flex flex-col items-center group" title="Divisor">
                    <div className="p-2 group-hover:bg-primary rounded-full transition-colors"><Minus size={20}/></div>
                </button>
                <button onClick={() => addBlock('COLOR_PALETTE')} className="flex flex-col items-center group" title="Cores">
                    <div className="p-2 group-hover:bg-primary rounded-full transition-colors"><Palette size={20}/></div>
                </button>
                <button onClick={() => addBlock('TYPOGRAPHY')} className="flex flex-col items-center group" title="Fonte">
                    <div className="p-2 group-hover:bg-primary rounded-full transition-colors"><Type size={20}/></div>
                </button>
                <button onClick={() => addBlock('DOWNLOAD')} className="flex flex-col items-center group" title="Arquivo">
                    <div className="p-2 group-hover:bg-primary rounded-full transition-colors"><Download size={20}/></div>
                </button>
             </div>
        </div>
    );

    return (
        <div className="relative min-h-[calc(100vh-100px)]">
            {/* View Mode Header Actions */}
            {!isEditing && isAdmin && (
                <div className="absolute top-0 right-0 z-10">
                    <Button onClick={() => setIsEditing(true)} icon={Edit3}>Editar Manual</Button>
                </div>
            )}

            {isEditing ? renderEditMode() : renderViewMode()}
        </div>
    );
};
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Trash2, Search, Filter, User as UserIcon, Calendar, 
  ChevronDown, Layout, BarChart2, MoreHorizontal, ArrowRight,
  MessageSquare, Settings, X, Send, Edit3, Briefcase, Palette, Check, Hash,
  Type, List, Tag, Tags, Clock, Paperclip, MapPin, CheckSquare, AlignLeft, GripVertical, UserPlus,
  Table2, KanbanSquare, CalendarRange, ArrowLeft, Lock, Download, Archive, Zap, Save, AlertCircle, RefreshCw,
  MoveLeft, MoveRight, XCircle, MoreVertical
} from 'lucide-react';
import { User, Ticket, Project, BoardColumn, ColumnType, ColumnOption, ChecklistItem, AutomationRule } from '../types';

// --- HELPERS ---

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
    '#64748b', '#9ca3af', '#fbbf24', '#4ade80', '#60a5fa', 
    '#818cf8', '#c084fc', '#f472b6', '#38bdf8', '#2dd4bf'
];

const COLUMN_TYPES_CONFIG: { type: ColumnType; label: string; icon: React.ElementType }[] = [
    { type: 'text', label: 'Texto', icon: Type },
    { type: 'status', label: 'Status', icon: Tag },
    { type: 'tags', label: 'Etiquetas', icon: Tags },
    { type: 'date', label: 'Data', icon: Calendar },
    { type: 'person', label: 'Pessoas', icon: UserIcon },
    { type: 'dropdown', label: 'Lista Suspensa', icon: List },
    { type: 'number', label: 'Números', icon: Hash },
];

const StatusBadge = ({ value, color, onClick, disabled }: { value: string, color?: string, onClick?: () => void, disabled?: boolean }) => {
    return (
        <div 
            onClick={disabled ? undefined : onClick}
            style={{ backgroundColor: color || '#e5e7eb', color: '#fff', textShadow: '0 1px 1px rgba(0,0,0,0.1)' }}
            className={`flex items-center justify-center h-8 w-full px-2 text-[13px] font-medium transition-all ${disabled ? 'cursor-default opacity-90' : 'cursor-pointer hover:opacity-90'} truncate select-none shadow-sm rounded-sm`}
        >
            {value}
        </div>
    );
};

// --- COMPONENTS ---

// 1. Column Header (Delegates menu to parent to avoid clipping)
const ColumnHeader = ({ column, onMenuOpen, onSort, sortState, canEdit }: { column: BoardColumn, onMenuOpen: (e: React.MouseEvent) => void, onSort: () => void, sortState: {colId: string, dir: 'asc'|'desc'} | null, canEdit: boolean }) => {
    return (
        <div className="h-full w-full flex items-center justify-center relative group cursor-pointer text-center select-none">
            <div onClick={onSort} className="flex items-center justify-center space-x-1 hover-text-secondary transition truncate px-1 w-full text-slate-800">
                <span className="truncate font-bold">{column.title}</span>
                {sortState?.colId === column.id && (
                    <ArrowRight size={12} className={`transform flex-shrink-0 text-secondary ${sortState.dir === 'desc' ? 'rotate-90' : '-rotate-90'}`} />
                )}
            </div>
            
            {canEdit && (
                <button onClick={(e) => { e.stopPropagation(); onMenuOpen(e); }} className="absolute right-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded transition z-10 text-gray-600">
                    <MoreHorizontal size={14} />
                </button>
            )}
        </div>
    );
};

// 2. Dynamic Cell
const DynamicCell = ({ item, column, users, projectId, updateItem, updateColumn, inModal, canEdit, actorId }: any) => {
    const value = item.data[column.id];
    const [isEditing, setIsEditing] = useState(false);
    const [showPopover, setShowPopover] = useState(false);
    const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0, width: 220 });
    const [isManagingOptions, setIsManagingOptions] = useState(false);
    const [tempOptions, setTempOptions] = useState<ColumnOption[]>(column.options || []);

    const containerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => { if(column.options) setTempOptions(column.options); }, [column.options]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const isInsideTrigger = containerRef.current && containerRef.current.contains(event.target as Node);
            const isInsidePopover = popoverRef.current && popoverRef.current.contains(event.target as Node);
            if (!isInsideTrigger && !isInsidePopover) {
                setShowPopover(false);
                setIsManagingOptions(false);
            }
        }
        if (showPopover) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showPopover]);

    const handleSaveValue = (val: any) => {
        if (!canEdit) return;
        const newData = { ...item.data, [column.id]: val };
        updateItem(item.id, { data: newData }, actorId);
        setIsEditing(false);
    };

    const togglePopover = (e: React.MouseEvent) => { 
        if (!canEdit) return;
        if (!showPopover) {
            const rect = e.currentTarget.getBoundingClientRect();
            // Calculate best position
            setPopoverCoords({ top: rect.bottom, left: rect.left, width: Math.max(rect.width, 240) });
        } else {
            setIsManagingOptions(false);
        }
        setShowPopover(!showPopover); 
    };

    // Option Management
    const handleUpdateOption = (idx: number, field: 'label' | 'color', val: string) => {
        const newOpts = [...tempOptions];
        newOpts[idx] = { ...newOpts[idx], [field]: val };
        setTempOptions(newOpts);
    };
    const handleAddOption = () => setTempOptions([...tempOptions, { id: Date.now().toString(), label: 'Nova Opção', color: '#94a3b8' }]);
    const handleDeleteOption = (idx: number) => setTempOptions(tempOptions.filter((_, i) => i !== idx));
    const handleSaveOptions = () => {
        if (updateColumn && projectId) {
            updateColumn(projectId, column.id, { options: tempOptions });
            setIsManagingOptions(false);
        }
    };

    const renderPopoverContent = () => {
        if (!showPopover) return null;
        return (
            <div ref={popoverRef} style={{ position: 'fixed', top: popoverCoords.top + 4, left: popoverCoords.left, width: isManagingOptions ? 300 : popoverCoords.width, zIndex: 9999 }} className="bg-white shadow-2xl rounded-lg border border-gray-200 animate-fade-in flex flex-col max-h-[350px]">
                {isManagingOptions ? (
                    <div className="flex flex-col h-full">
                        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <span className="text-xs font-bold uppercase text-gray-500">Editar Opções</span>
                            <button onClick={() => setIsManagingOptions(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {tempOptions.map((opt, idx) => (
                                <div key={idx} className="flex items-center space-x-2">
                                    <div className="relative group/color shrink-0">
                                        <div className="w-6 h-6 rounded-full cursor-pointer border border-gray-200 shadow-sm" style={{ backgroundColor: opt.color }}></div>
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded p-1 grid grid-cols-4 gap-1 z-50 hidden group-hover/color:grid w-32">
                                            {PRESET_COLORS.map(c => <div key={c} onClick={() => handleUpdateOption(idx, 'color', c)} className="w-5 h-5 rounded-full cursor-pointer hover:scale-110" style={{ backgroundColor: c }}></div>)}
                                        </div>
                                    </div>
                                    <input type="text" value={opt.label} onChange={(e) => handleUpdateOption(idx, 'label', e.target.value)} className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-500" />
                                    <button onClick={() => handleDeleteOption(idx)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            ))}
                            <button onClick={handleAddOption} className="w-full py-1 text-xs text-indigo-600 font-bold hover:bg-indigo-50 rounded dashed border border-indigo-200 border-dashed">+ Adicionar</button>
                        </div>
                        <div className="p-2 border-t border-gray-100">
                            <button onClick={handleSaveOptions} className="w-full bg-indigo-600 text-white py-1.5 rounded text-xs font-bold hover:bg-indigo-700 flex items-center justify-center"><Save size={12} className="mr-1"/> Salvar</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {column.type === 'person' ? (
                            <div className="flex-1 overflow-y-auto p-1">
                                {users.map((u: User) => {
                                    const isSelected = Array.isArray(value) ? value.includes(u.id) : value === u.id;
                                    return (
                                        <div key={u.id} onClick={() => {
                                            const currentArr = Array.isArray(value) ? value : (value ? [value] : []);
                                            const newVal = currentArr.includes(u.id) ? currentArr.filter((id: string) => id !== u.id) : [...currentArr, u.id];
                                            handleSaveValue(newVal);
                                        }} className={`px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${isSelected ? 'bg-indigo-50' : ''}`}>
                                            <div className="flex items-center space-x-2 overflow-hidden"><img src={u.avatar} className="w-6 h-6 rounded-full flex-shrink-0" /><span className="text-sm text-slate-700 truncate">{u.name}</span></div>
                                            {isSelected && <Check size={14} className="text-indigo-600 flex-shrink-0" />}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-1 space-y-1 bg-white">
                                {column.type !== 'tags' && <div onClick={() => { handleSaveValue(null); setShowPopover(false); }} className="px-3 py-2 hover:bg-gray-50 text-xs text-gray-500 cursor-pointer rounded flex items-center"><div className="w-4 h-4 border border-gray-300 rounded-full mr-2 bg-white"></div> Limpar Seleção</div>}
                                {column.options?.map((opt: ColumnOption) => {
                                    if(column.type === 'tags') {
                                        const currentTags = Array.isArray(value) ? value : (value ? [value] : []);
                                        const isSelected = currentTags.includes(opt.label);
                                        return (
                                            <div key={opt.id} onClick={() => handleSaveValue(isSelected ? currentTags.filter((t: string) => t !== opt.label) : [...currentTags, opt.label])} className={`px-3 py-1.5 hover:bg-gray-50 cursor-pointer rounded flex items-center justify-between ${isSelected ? 'bg-indigo-50' : ''}`}>
                                                <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color }}></div><span className="text-sm text-slate-700">{opt.label}</span></div>{isSelected && <Check size={14} className="text-indigo-600"/>}
                                            </div>
                                        )
                                    }
                                    return (
                                        <div key={opt.id} onClick={() => { handleSaveValue(opt.label); setShowPopover(false); }} className="px-3 py-1.5 hover:bg-gray-50 cursor-pointer rounded flex items-center group">
                                            <div className="w-full h-6 rounded flex items-center justify-center text-xs text-white font-medium shadow-sm" style={{ backgroundColor: opt.color }}>{opt.label}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {['status', 'dropdown', 'tags'].includes(column.type) && updateColumn && (
                            <div className="border-t border-gray-100 p-2 bg-gray-50 rounded-b-lg">
                                <button onClick={() => setIsManagingOptions(true)} className="w-full flex items-center justify-center space-x-2 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200 py-1.5 rounded transition"><Edit3 size={12} /> <span>Gerenciar Opções</span></button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    if (['status', 'priority', 'dropdown'].includes(column.type)) {
        const option = column.options?.find((o: any) => o.label === value);
        return (
            <div className={`h-full relative group p-[1px] ${inModal ? 'w-full' : 'border-r border-gray-200'}`} ref={containerRef}>
                <div onClick={togglePopover} className="h-full w-full relative">
                    <StatusBadge value={value || '-'} color={option?.color || '#9ca3af'} disabled={!canEdit} />
                    {canEdit && !inModal && <div className="absolute top-0 right-0 h-full w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none text-white drop-shadow-md"><ChevronDown size={12} /></div>}
                </div>
                {renderPopoverContent()}
            </div>
        );
    }

    if (column.type === 'tags') {
        const selectedTags: string[] = Array.isArray(value) ? value : (value ? [value] : []);
        return (
            <div className={`h-full relative group p-[1px] ${inModal ? 'w-full' : 'border-r border-gray-200'}`} ref={containerRef}>
                <div onClick={togglePopover} className={`h-full w-full relative flex items-center flex-wrap gap-1 content-center px-1 overflow-hidden ${canEdit ? 'cursor-pointer hover:bg-gray-50' : ''}`}>
                    {selectedTags.length > 0 ? selectedTags.slice(0, 2).map(tag => <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-sm" style={{ backgroundColor: column.options?.find((o:any) => o.label === tag)?.color || '#9ca3af' }}>{tag}</span>) : <div className="flex items-center justify-center w-full text-gray-300"><Tags size={14}/></div>}
                    {selectedTags.length > 2 && <span className="text-[9px] text-gray-400 font-bold">+{selectedTags.length - 2}</span>}
                    {canEdit && !inModal && <div className="absolute top-0 right-0 h-full w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none text-gray-400 drop-shadow-sm"><Plus size={10} /></div>}
                </div>
                {renderPopoverContent()}
            </div>
        );
    }

    if (column.type === 'person') {
        const selectedIds = Array.isArray(value) ? value : (value ? [value] : []);
        const selectedUsers = users.filter((u: User) => selectedIds.includes(u.id));
        return (
            <div className={`h-full relative group flex items-center justify-center ${inModal ? 'w-full justify-start' : 'border-r border-gray-200'}`} ref={containerRef}>
                <div onClick={togglePopover} className={`flex -space-x-1.5 overflow-hidden p-1 ${canEdit ? 'cursor-pointer hover:bg-gray-50' : ''} rounded w-full h-full items-center ${inModal ? 'justify-start pl-0' : 'justify-center'}`}>
                    {selectedUsers.length > 0 ? (
                        <>
                            {selectedUsers.slice(0, 3).map((u: User) => <img key={u.id} src={u.avatar} title={u.name} className="w-6 h-6 rounded-full border border-white" />)}
                            {selectedUsers.length > 3 && <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[9px] font-bold">+{selectedUsers.length - 3}</div>}
                            {inModal && canEdit && <div className="w-6 h-6 rounded-full bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 ml-1"><Plus size={12} /></div>}
                        </>
                    ) : <div className={`w-6 h-6 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 ${!canEdit ? 'opacity-50' : ''}`}>{canEdit ? <Plus size={12} /> : <UserIcon size={12} />}</div>}
                </div>
                {renderPopoverContent()}
            </div>
        );
    }

    if (column.type === 'date') {
        return (
            <div className={`h-full w-full relative group ${inModal ? 'border-b border-transparent hover:border-gray-200 rounded px-1 h-8' : 'border-r border-gray-200 hover:bg-gray-50'} flex items-center justify-center overflow-hidden cursor-pointer`}>
                 <div className={`flex items-center justify-center w-full h-full pointer-events-none z-0 ${!value ? 'text-gray-300' : 'text-slate-700 font-medium text-[13px]'}`}>
                     {value ? <span>{new Date(value).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span> : <Calendar size={16} />}
                 </div>
                 {canEdit && (
                     <input 
                        type="date" 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-50"
                        value={value || ''}
                        onChange={(e) => handleSaveValue(e.target.value)}
                        onClick={(e) => { e.stopPropagation(); if ('showPicker' in HTMLInputElement.prototype) { try { e.currentTarget.showPicker(); } catch(e) {} } }}
                        onMouseDown={(e) => e.stopPropagation()} 
                     />
                 )}
            </div>
        );
    }

    // Default (Text/Number)
    return (
        <div className={`h-full relative ${inModal ? 'w-full h-8 border-b border-transparent hover:border-gray-200' : 'border-r border-gray-200'}`}>
            {isEditing && canEdit ? (
                <input autoFocus type={column.type === 'number' ? 'number' : 'text'} className="w-full h-full px-2 text-[13px] outline-none bg-white shadow-inner text-black font-medium rounded" defaultValue={value} onBlur={(e) => handleSaveValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
            ) : (
                <div onClick={() => canEdit && setIsEditing(true)} className={`w-full h-full px-2 flex items-center text-[13px] text-black font-medium ${canEdit ? 'hover:bg-gray-50 cursor-text' : ''} truncate`} title={value}>
                    {value || (inModal && canEdit ? <span className="text-gray-400 italic flex items-center"><Type size={12} className="mr-2"/> Vazio</span> : '')}
                </div>
            )}
        </div>
    );
};

// ... (AutomationModal and ItemDetailModal reused from previous context)
const AutomationModal = ({ project, onClose, onSave, onDelete }: any) => {
    const [name, setName] = useState('Nova Regra');
    const [triggerColumnId, setTriggerColumnId] = useState('');
    const [triggerValue, setTriggerValue] = useState('');
    const [actionType, setActionType] = useState<AutomationRule['actionType']>('UPDATE_FIELD');
    const [actionTargetId, setActionTargetId] = useState('');
    const [actionValue, setActionValue] = useState('');
    const { users } = useApp();

    const handleSave = () => {
        if(!triggerColumnId || !actionTargetId) return;
        onSave({ id: `rule_${Date.now()}`, name, triggerColumnId, triggerValue, actionType, actionTargetId, actionValue, active: true });
        setName('Nova Regra'); 
    };

    const triggerCol = project.columns.find((c:any) => c.id === triggerColumnId);
    const actionTargetCol = project.columns.find((c:any) => c.id === actionTargetId);

    return (
        <div className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-[700px] flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center"><Zap size={18} className="mr-2 text-yellow-500"/> Automações</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome da Regra" className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm" value={name} onChange={e => setName(e.target.value)}/>
                            <div className="grid grid-cols-2 gap-6 relative">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase block">Gatilho (Coluna)</label>
                                    <select className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm" value={triggerColumnId} onChange={e => setTriggerColumnId(e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {project.columns.map((c:any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                    {triggerCol?.options ? (
                                        <select className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm" value={triggerValue} onChange={e => setTriggerValue(e.target.value)}>
                                            <option value="">Qualquer Valor</option>
                                            {triggerCol.options.map((o:any) => <option key={o.id} value={o.label}>{o.label}</option>)}
                                        </select>
                                    ) : <input type="text" placeholder="Valor" className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm" value={triggerValue} onChange={e => setTriggerValue(e.target.value)}/>}
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase block">Ação</label>
                                    <select className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm" value={actionType} onChange={e => setActionType(e.target.value as any)}>
                                        <option value="UPDATE_FIELD">Alterar Campo</option>
                                        <option value="ASSIGN_USER">Atribuir Pessoa</option>
                                        <option value="NOTIFY_USER">Notificar</option>
                                    </select>
                                    {actionType === 'UPDATE_FIELD' && (
                                        <>
                                            <select className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm" value={actionTargetId} onChange={e => setActionTargetId(e.target.value)}>
                                                <option value="">Alvo...</option>
                                                {project.columns.filter((c:any) => c.id !== triggerColumnId).map((c:any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                                            </select>
                                            {actionTargetCol?.options ? (
                                                <select className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm" value={actionValue} onChange={e => setActionValue(e.target.value)}>
                                                    <option value="">Novo Valor...</option>
                                                    {actionTargetCol.options.map((o:any) => <option key={o.id} value={o.label}>{o.label}</option>)}
                                                </select>
                                            ) : <input type="text" placeholder="Valor" className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm" value={actionValue} onChange={e => setActionValue(e.target.value)}/>}
                                        </>
                                    )}
                                    {(actionType === 'ASSIGN_USER' || actionType === 'NOTIFY_USER') && (
                                        <select className="w-full bg-white border border-gray-300 p-2.5 rounded-lg text-sm" value={actionTargetId} onChange={e => setActionTargetId(e.target.value)}>
                                            <option value="">Usuário...</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <button onClick={handleSave} className="w-full bg-secondary text-white py-2.5 rounded-lg text-sm font-bold">Salvar Regra</button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {project.automations?.map(rule => (
                            <div key={rule.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded shadow-sm">
                                <p className="text-sm font-bold text-slate-800">{rule.name}</p>
                                <button onClick={() => onDelete(rule.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ItemDetailModal = ({ item, project, users, onClose, updateItem, addComment, archiveItem, deleteItem, canEdit, canDelete, canArchive, updateColumn, addColumn, deleteColumn }: any) => {
    const [commentText, setCommentText] = useState('');
    const { currentUser } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);
    const groupName = project.groups.find((g: any) => g.id === item.groupId)?.title || 'Sem Grupo';

    // State for managing new column in modal
    const [isAddColOpen, setIsAddColOpen] = useState(false);
    // State for managing column editing context (rename/delete)
    const [editingColId, setEditingColId] = useState<string | null>(null);

    const handleAddColumn = (type: ColumnType) => {
        const titleMap: Record<string, string> = { text: 'Novo Texto', status: 'Novo Status', date: 'Nova Data', person: 'Nova Pessoa', dropdown: 'Nova Lista', number: 'Novo Número', tags: 'Novas Etiquetas' };
        if (addColumn) {
            addColumn(project.id, { id: `c_${Date.now()}`, title: titleMap[type], type, width: '150px', options: ['status', 'dropdown', 'tags'].includes(type) ? [{id:'opt1', label:'Opção 1', color:'#ccc'}] : undefined });
        }
        setIsAddColOpen(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                <div className="bg-white shadow-2xl rounded-xl w-full max-w-6xl h-[90vh] flex flex-col pointer-events-auto animate-fade-in overflow-hidden border border-gray-200 relative">
                    <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                         <div className="flex items-center space-x-3 overflow-hidden">
                             <div className="bg-secondary-light text-secondary p-2 rounded-lg"><Briefcase size={20} /></div>
                             <div className="flex flex-col">
                                 <span className="text-xs text-gray-400 uppercase font-bold tracking-wider flex items-center space-x-1"><span>{project.title}</span> <span className="text-gray-300">/</span> <span>{groupName}</span></span>
                                 <input type="text" className="font-bold text-lg text-slate-800 outline-none bg-transparent placeholder-gray-300" value={item.title} onChange={(e) => canEdit && updateItem(item.id, { title: e.target.value })} placeholder="Nome da Tarefa" readOnly={!canEdit}/>
                             </div>
                         </div>
                         <div className="flex items-center space-x-2 isolate">
                             {canArchive && <button onClick={() => {archiveItem(item.id, true); onClose();}} className="p-2 hover:bg-orange-50 rounded text-gray-400 hover:text-orange-500 flex items-center text-xs font-bold cursor-pointer"><Archive size={18} className="mr-1"/> Arquivar</button>}
                             {canDelete && <button onClick={() => {deleteItem(item.id); onClose();}} className="p-2 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 flex items-center text-xs font-bold cursor-pointer"><Trash2 size={18} className="mr-1"/> Excluir</button>}
                             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 cursor-pointer"><X size={24}/></button>
                         </div>
                    </div>
                    <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative" onClick={() => { setIsAddColOpen(false); setEditingColId(null); }}>
                            <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8 border-b border-gray-100 pb-6">
                                {project.columns.map((col: any) => (
                                    <div key={col.id} className="flex flex-col min-w-[120px] relative group/colHeader">
                                        <div className="flex items-center justify-between mb-2">
                                            <div 
                                                className={`text-xs font-bold uppercase block cursor-pointer flex items-center space-x-1 ${editingColId === col.id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(canEdit) setEditingColId(editingColId === col.id ? null : col.id);
                                                }}
                                            >
                                                <span>{col.title}</span>
                                                {canEdit && <MoreHorizontal size={12} className="opacity-0 group-hover/colHeader:opacity-100" />}
                                            </div>
                                        </div>
                                        
                                        {/* Edit Column Popover */}
                                        {editingColId === col.id && (
                                            <div className="absolute top-6 left-0 bg-white shadow-xl border border-gray-200 rounded p-2 z-50 w-48 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    className="w-full text-xs border border-gray-300 rounded p-1 mb-2 outline-none focus:border-indigo-500" 
                                                    defaultValue={col.title}
                                                    onKeyDown={(e) => {
                                                        if(e.key === 'Enter') {
                                                            updateColumn(project.id, col.id, { title: e.currentTarget.value });
                                                            setEditingColId(null);
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    onClick={() => {
                                                        if(confirm('Excluir esta coluna? Dados serão perdidos.')) {
                                                            deleteColumn(project.id, col.id);
                                                            setEditingColId(null);
                                                        }
                                                    }}
                                                    className="w-full text-left text-xs text-red-500 hover:bg-red-50 p-1 rounded flex items-center"
                                                >
                                                    <Trash2 size={12} className="mr-1"/> Excluir Coluna
                                                </button>
                                            </div>
                                        )}

                                        <div className="h-8"><DynamicCell item={item} column={col} users={users} projectId={project.id} updateItem={updateItem} updateColumn={updateColumn} inModal={true} canEdit={canEdit} actorId={currentUser?.id} /></div>
                                    </div>
                                ))}
                                
                                {/* Add Column Button inside Modal */}
                                {canEdit && (
                                    <div className="flex items-center h-full pt-6 relative">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsAddColOpen(!isAddColOpen); }}
                                            className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition border border-dashed border-indigo-200 hover:border-indigo-400"
                                        >
                                            <Plus size={14}/> <span>Adicionar Campo</span>
                                        </button>
                                        
                                        {isAddColOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl rounded-lg border border-gray-100 py-1 z-50 text-left animate-fade-in font-normal" onClick={(e) => e.stopPropagation()}>
                                                <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">Tipo de Propriedade</div>
                                                {COLUMN_TYPES_CONFIG.map(type => (
                                                    <button key={type.type} onClick={() => handleAddColumn(type.type)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center text-gray-700">
                                                        <type.icon size={14} className="mr-2 text-gray-400"/> {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="mb-8 group">
                                <h3 className="flex items-center text-sm font-bold text-slate-800 uppercase tracking-wide mb-2"><AlignLeft size={16} className="mr-2 text-gray-400"/> Descrição</h3>
                                <textarea className="w-full min-h-[120px] p-4 rounded-lg border border-gray-200 text-sm text-gray-700 leading-relaxed outline-none resize-none bg-gray-50/30 hover:bg-white focus:bg-white" placeholder="Descrição..." value={item.description || ''} onChange={(e) => canEdit && updateItem(item.id, { description: e.target.value })} readOnly={!canEdit}></textarea>
                            </div>
                        </div>
                        <div className="w-[350px] bg-gray-50 border-l border-gray-200 flex flex-col relative z-0">
                            <div className="p-4 border-b border-gray-200 bg-white"><h3 className="text-sm font-bold text-slate-800 flex items-center"><MessageSquare size={16} className="mr-2 text-secondary"/> Comentários</h3></div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                                {item.comments.map((comment: any) => (
                                    <div key={comment.id} className="flex space-x-3 group animate-fade-in">
                                        <img src={users.find((u: any) => u.id === comment.userId)?.avatar} className="w-8 h-8 rounded-full mt-1 border border-gray-200"/>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between"><span className="text-xs font-bold text-slate-800 mr-2">{users.find((u: any) => u.id === comment.userId)?.name}</span><span className="text-[10px] text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span></div>
                                            <div className="mt-1 bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-sm text-gray-700">{comment.text}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={(e) => { e.preventDefault(); if(commentText.trim()) { addComment(item.id, commentText, currentUser?.id); setCommentText(''); } }} className="relative">
                                    <input type="text" className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-secondary outline-none transition bg-white" placeholder="Escreva um comentário..." value={commentText} onChange={(e) => setCommentText(e.target.value)}/>
                                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-secondary"><Send size={16}/></button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export const Tickets: React.FC = () => {
    const { 
        projects, activeProjectId, setActiveProjectId, addProject, deleteProject,
        addItem, updateItem, deleteItem, archiveItem, addComment, 
        deleteColumn, updateColumn, addAutomation, deleteAutomation, addColumn, updateProject,
        users 
    } = useApp();
    
    const { currentUser } = useAuth();

    // Local State
    const [viewMode, setViewMode] = useState<'board' | 'table' | 'timeline'>('board');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAutomationOpen, setIsAutomationOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Ticket | null>(null);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    
    // Filters
    const [activeFilters, setActiveFilters] = useState<{columnId: string, value: string}[]>([]);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [filterNewColumnId, setFilterNewColumnId] = useState('');
    const [filterNewValue, setFilterNewValue] = useState('');
    const filterMenuRef = useRef<HTMLDivElement>(null);

    // Kanban Menu (Fixed Position)
    const [activeGroupMenu, setActiveGroupMenu] = useState<{ optionId: string, top: number, left: number } | null>(null);
    const groupMenuRef = useRef<HTMLDivElement>(null);

    // Table Header Menu (Fixed Position)
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<{ colId: string, top: number, left: number } | null>(null);
    const headerMenuRef = useRef<HTMLDivElement>(null);
    
    // Sort
    const [sortState, setSortState] = useState<{colId: string, dir: 'asc'|'desc'} | null>(null);

    // Project Safety
    const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

    useEffect(() => {
        if (!projects.find(p => p.id === activeProjectId) && projects.length > 0) setActiveProjectId(projects[0].id);
    }, [projects, activeProjectId]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) setIsFilterMenuOpen(false);
            
            // Close Kanban Menu
            if (activeGroupMenu && groupMenuRef.current && !groupMenuRef.current.contains(event.target as Node)) {
                setActiveGroupMenu(null);
            }
            // Close Header Menu
            if (activeHeaderMenu && headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
                setActiveHeaderMenu(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeGroupMenu, activeHeaderMenu]);

    // --- HANDLERS ---

    const handleAddColumn = (type: ColumnType) => {
        const titleMap: Record<string, string> = { text: 'Novo Texto', status: 'Novo Status', date: 'Nova Data', person: 'Nova Pessoa', dropdown: 'Nova Lista', number: 'Novo Número', tags: 'Novas Etiquetas' };
        addColumn(activeProject.id, { id: `c_${Date.now()}`, title: titleMap[type], type, width: '150px', options: ['status', 'dropdown', 'tags'].includes(type) ? [{id:'opt1', label:'Opção 1', color:'#ccc'}] : undefined });
        setIsAddColumnOpen(false);
    };

    const toggleMember = (userId: string) => {
        const currentMembers = activeProject.members || [];
        updateProject(activeProject.id, { members: currentMembers.includes(userId) ? currentMembers.filter(id => id !== userId) : [...currentMembers, userId] });
    };

    // Actions for buttons
    const promptAddProject = () => { 
        const name = prompt("Nome do novo projeto:"); 
        if (name) addProject(name); 
    };
    
    const confirmDeleteProject = () => { 
        if(projects.length <= 1) {
            alert('Não é possível excluir o único projeto existente.');
            return;
        }
        if (confirm("Tem certeza que deseja excluir este projeto? Todas as tarefas serão perdidas.")) {
            deleteProject(activeProject.id); 
        }
    };

    // Kanban Menu Handlers
    const openGroupMenu = (e: React.MouseEvent, optionId: string) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setActiveGroupMenu({ optionId, top: rect.bottom + 5, left: rect.right - 200 }); // adjust left to align right
    };

    const handleUpdateOption = (columnId: string, optionId: string, newVal: string) => {
        const col = activeProject.columns.find(c => c.id === columnId);
        if (col && col.options) {
            updateColumn(activeProject.id, columnId, { options: col.options.map(o => o.id === optionId ? { ...o, label: newVal } : o) });
        }
        setActiveGroupMenu(null);
    };

    const handleDeleteOption = (columnId: string, optionId: string) => {
        if(confirm('Excluir esta coluna? As tarefas nela ficarão sem status.')) {
            const col = activeProject.columns.find(c => c.id === columnId);
            if (col && col.options) {
                updateColumn(activeProject.id, columnId, { options: col.options.filter(o => o.id !== optionId) });
            }
            setActiveGroupMenu(null);
        }
    };

    // Table Header Handlers
    const openHeaderMenu = (e: React.MouseEvent, colId: string) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setActiveHeaderMenu({ colId, top: rect.bottom + 5, left: rect.right - 180 });
    };

    const handleRenameColumn = (colId: string, newTitle: string) => {
        updateColumn(activeProject.id, colId, { title: newTitle });
        setActiveHeaderMenu(null);
    };

    const handleDeleteColumn = (colId: string) => {
        if (confirm("Tem certeza que deseja excluir esta coluna? Dados serão perdidos.")) {
            deleteColumn(activeProject.id, colId);
            setActiveHeaderMenu(null);
        }
    };

    const addFilter = () => {
        if (filterNewColumnId && filterNewValue) {
            setActiveFilters([...activeFilters, { columnId: filterNewColumnId, value: filterNewValue }]);
            setFilterNewValue('');
            setFilterNewColumnId('');
            setIsFilterMenuOpen(false);
        }
    };

    if (!activeProject) return <div className="flex flex-col items-center justify-center h-full text-gray-400"><p>Nenhum projeto encontrado.</p><button onClick={promptAddProject} className="mt-4 px-4 py-2 bg-primary text-white rounded">Criar Projeto</button></div>;

    const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
    const canManage = canEdit;
    const userCanEditItems = true; 
    const isAdmin = currentUser?.role === 'ADMIN';

    // --- FILTER & DATA LOGIC ---
    let items = activeProject.items.filter(item => !item.archived);

    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        items = items.filter(i => i.title.toLowerCase().includes(lower) || (i.description && i.description.toLowerCase().includes(lower)));
    }

    if (activeFilters.length > 0) {
        items = items.filter(item => activeFilters.every(filter => {
            if (filter.columnId === 'assignee_any' || filter.columnId === 'member_any') {
                const userId = filter.value;
                if (item.assigneeId === userId) return true;
                return activeProject.columns.some(c => {
                    if (c.type !== 'person') return false;
                    const val = item.data[c.id];
                    return Array.isArray(val) ? val.includes(userId) : val === userId;
                });
            }
            const val = item.data[filter.columnId];
            if (Array.isArray(val)) return val.includes(filter.value);
            return val == filter.value; 
        }));
    }

    if (sortState) {
        items.sort((a, b) => {
            const valA = a.data[sortState.colId] || '';
            const valB = b.data[sortState.colId] || '';
            if (valA < valB) return sortState.dir === 'asc' ? -1 : 1;
            if (valA > valB) return sortState.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    const statusCol = activeProject.columns.find(c => c.type === 'status');
    const groupedItems: Record<string, Ticket[]> = {};
    const groups: {id: string, label: string, color: string, optionId?: string}[] = [];

    if (statusCol && statusCol.options) {
        statusCol.options.forEach(opt => {
            // FIX: IMPORTANT - Store optionId so we can delete it later
            groups.push({ id: opt.id, label: opt.label, color: opt.color, optionId: opt.id }); 
            groupedItems[opt.id] = [];
        });
        groups.push({ id: 'undefined', label: 'Sem Status', color: '#e5e7eb' });
        groupedItems['undefined'] = [];

        items.forEach(item => {
            const statusLabel = item.data[statusCol.id];
            const opt = statusCol.options?.find(o => o.label === statusLabel);
            const key = opt ? opt.id : 'undefined';
            if (groupedItems[key]) groupedItems[key].push(item);
            else groupedItems['undefined'].push(item);
        });
    } else {
        groups.push({ id: 'all', label: 'Todas as Tarefas', color: '#e5e7eb' });
        groupedItems['all'] = items;
    }

    const handleSort = (colId: string) => setSortState(prev => (prev?.colId === colId ? (prev.dir === 'asc' ? { colId, dir: 'desc' } : null) : { colId, dir: 'asc' }));
    
    const handleCreateTicket = (groupId?: string) => {
        let initialData: any = {};
        if (groupId && statusCol && groupId !== 'undefined') {
            const opt = statusCol.options?.find(o => o.id === groupId); 
            if(opt) initialData = { data: { [statusCol.id]: opt.label } };
        }
        addItem('Nova Tarefa', activeProject.groups[0]?.id || 'g1', initialData);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-t-xl shadow-sm border border-gray-200 overflow-hidden relative">
             {/* Toolbar */}
             <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 bg-white shrink-0 relative z-40">
                <div className="flex items-center space-x-4">
                     <div className="flex items-center space-x-2 relative">
                         <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Layout size={20}/></div>
                         <div className="relative z-10">
                             <select 
                                className="text-lg font-bold text-slate-800 bg-transparent outline-none cursor-pointer max-w-[200px]"
                                value={activeProjectId}
                                onChange={(e) => setActiveProjectId(e.target.value)}
                             >
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                             </select>
                         </div>
                         {/* RESTORED PROJECT ACTIONS */}
                         {canManage && (
                             <div className="flex items-center space-x-1 ml-2 relative z-50">
                                <button onClick={promptAddProject} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="Novo Projeto"><Plus size={16}/></button>
                                <button onClick={confirmDeleteProject} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition" title="Excluir Projeto"><Trash2 size={16}/></button>
                             </div>
                         )}
                     </div>
                     <div className="h-6 w-px bg-gray-200"></div>
                     <div className="flex bg-gray-100 p-1 rounded-lg">
                         <button onClick={() => setViewMode('board')} className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} title="Kanban"><KanbanSquare size={18}/></button>
                         <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} title="Tabela"><Table2 size={18}/></button>
                         <button onClick={() => setViewMode('timeline')} className={`p-1.5 rounded ${viewMode === 'timeline' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} title="Cronograma"><CalendarRange size={18}/></button>
                     </div>
                </div>

                <div className="flex items-center space-x-3">
                     <div className="relative">
                         <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                         <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-indigo-100 outline-none w-48" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                     </div>
                     
                     {/* Quick Assignee Filter */}
                     <div className="relative hidden md:block">
                        <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <select 
                            className="pl-9 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 appearance-none cursor-pointer hover:bg-gray-100 transition max-w-[150px]"
                            value={activeFilters.find(f => f.columnId === 'assignee_any')?.value || 'all'}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'all') {
                                    setActiveFilters(activeFilters.filter(f => f.columnId !== 'assignee_any'));
                                } else {
                                    const others = activeFilters.filter(f => f.columnId !== 'assignee_any');
                                    setActiveFilters([...others, { columnId: 'assignee_any', value: val }]);
                                }
                            }}
                        >
                            <option value="all">Todos (Resp.)</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                     </div>

                     <div className="relative" ref={filterMenuRef}>
                         <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border border-dashed border-gray-300 hover:border-indigo-300 hover:text-indigo-600 transition ${activeFilters.length > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-300' : 'text-gray-500'}`}>
                             <Filter size={16}/> <span className="text-xs font-bold">Filtros</span> {activeFilters.length > 0 && <span className="bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeFilters.length}</span>}
                         </button>
                         {isFilterMenuOpen && (
                             <div className="absolute right-0 top-full mt-2 w-72 bg-white shadow-2xl rounded-lg border border-gray-200 p-4 z-50 animate-fade-in">
                                 <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Adicionar Filtro</h4>
                                 <div className="space-y-3">
                                     <div className="flex flex-col">
                                         <label className="text-[10px] font-bold text-gray-500 mb-1">Campo</label>
                                         <select className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm outline-none text-slate-800" value={filterNewColumnId} onChange={(e) => { setFilterNewColumnId(e.target.value); setFilterNewValue(''); }}>
                                             <option value="">Selecione...</option>
                                             <option value="assignee_any">Responsável</option>
                                             <option value="member_any">Membro</option>
                                             {activeProject.columns.filter(c => ['status', 'priority', 'person', 'tags', 'dropdown'].includes(c.type)).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                         </select>
                                     </div>
                                     {filterNewColumnId && (
                                         <div className="flex flex-col">
                                             <label className="text-[10px] font-bold text-gray-500 mb-1">Valor</label>
                                             {(() => {
                                                 if (filterNewColumnId === 'assignee_any' || filterNewColumnId === 'member_any') {
                                                     return <select className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-slate-800" value={filterNewValue} onChange={(e) => setFilterNewValue(e.target.value)}><option value="">Selecione Pessoa...</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                                                 }
                                                 const col = activeProject.columns.find(c => c.id === filterNewColumnId);
                                                 if (col?.type === 'person') return <select className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-slate-800" value={filterNewValue} onChange={(e) => setFilterNewValue(e.target.value)}><option value="">Selecione Pessoa...</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                                                 if (col?.options) return <select className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-slate-800" value={filterNewValue} onChange={(e) => setFilterNewValue(e.target.value)}><option value="">Selecione Opção...</option>{col.options.map(o => <option key={o.id} value={o.label}>{o.label}</option>)}</select>
                                                 return <input type="text" className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-slate-800" value={filterNewValue} onChange={(e) => setFilterNewValue(e.target.value)} />
                                             })()}
                                         </div>
                                     )}
                                     <button onClick={addFilter} disabled={!filterNewColumnId || !filterNewValue} className="w-full bg-indigo-600 text-white py-2 rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">Aplicar Filtro</button>
                                 </div>
                             </div>
                         )}
                     </div>

                     <div className="flex items-center -space-x-2 border-r border-gray-200 pr-3 mr-1">
                         {users.filter(u => activeProject.members?.includes(u.id)).slice(0, 3).map(u => <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white" title={u.name}/>)}
                         {canManage && <button onClick={() => setIsMembersModalOpen(true)} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-indigo-600" title="Gerenciar Membros"><UserPlus size={14}/></button>}
                     </div>

                     <button onClick={() => setIsAutomationOpen(true)} className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition" title="Automações"><Zap size={20}/></button>
                     <button onClick={() => handleCreateTicket()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-indigo-200"><Plus size={16} className="mr-2"/> Novo</button>
                </div>
             </div>

             {/* Active Filters */}
             {activeFilters.length > 0 && (
                 <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2 flex-wrap">
                     <span className="text-xs font-bold text-gray-400 uppercase">Filtros Ativos:</span>
                     {activeFilters.map((filter, idx) => {
                         const col = activeProject.columns.find(c => c.id === filter.columnId);
                         let label = filter.value;
                         let title = col?.title;
                         
                         if (filter.columnId === 'assignee_any') {
                             title = 'Responsável';
                             label = users.find(u => u.id === filter.value)?.name || label;
                         } else if (filter.columnId === 'member_any') {
                             title = 'Membro';
                             label = users.find(u => u.id === filter.value)?.name || label;
                         } else if (col?.type === 'person') {
                             label = users.find(u => u.id === filter.value)?.name || label;
                         }
                         
                         return (
                             <div key={idx} className="bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs flex items-center shadow-sm">
                                 <span className="font-bold mr-1">{title}:</span> {label}
                                 <button onClick={() => setActiveFilters(activeFilters.filter((_, i) => i !== idx))} className="ml-2 text-indigo-400 hover:text-indigo-800"><XCircle size={14}/></button>
                             </div>
                         )
                     })}
                     <button onClick={() => setActiveFilters([])} className="text-xs text-gray-400 underline hover:text-red-500 ml-auto">Limpar todos</button>
                 </div>
             )}

             <div className="flex-1 overflow-hidden bg-gray-50/50 relative">
                {viewMode === 'table' ? (
                    <div className="h-full overflow-auto custom-scrollbar">
                        <table className="min-w-max w-full text-left border-collapse">
                            <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 border-b border-gray-200 w-[40px] text-center"><input type="checkbox"/></th>
                                    <th className="px-4 py-3 border-b border-gray-200 min-w-[300px] text-xs font-bold text-gray-500 uppercase">Tarefa</th>
                                    {activeProject.columns.map(col => (
                                        <th key={col.id} className="border-b border-gray-200 p-0" style={{ width: col.width || '150px' }}>
                                            <ColumnHeader column={col} onMenuOpen={(e) => openHeaderMenu(e, col.id)} onSort={() => handleSort(col.id)} sortState={sortState} canEdit={canEdit} />
                                        </th>
                                    ))}
                                    {canEdit && (
                                        <th className="border-b border-gray-200 w-[50px] text-center relative">
                                            <button onClick={() => setIsAddColumnOpen(!isAddColumnOpen)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><Plus size={16}/></button>
                                            {isAddColumnOpen && (
                                                <div className="absolute top-full right-0 mt-1 w-48 bg-white shadow-xl rounded-lg border border-gray-100 py-1 z-50 text-left animate-fade-in font-normal">
                                                    <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100 flex justify-between"><span>Tipo de Coluna</span><X size={14} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsAddColumnOpen(false); }}/></div>
                                                    {COLUMN_TYPES_CONFIG.map(type => <button key={type.type} onClick={() => handleAddColumn(type.type)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center text-gray-700"><type.icon size={14} className="mr-2 text-gray-400"/> {type.label}</button>)}
                                                </div>
                                            )}
                                            {isAddColumnOpen && <div className="fixed inset-0 z-40" onClick={() => setIsAddColumnOpen(false)}></div>}
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} className="bg-white hover:bg-gray-50 group border-b border-gray-100">
                                        <td className="px-4 py-2 text-center border-r border-gray-100"><input type="checkbox"/></td>
                                        <td className="px-4 py-2 border-r border-gray-100 cursor-pointer" onClick={() => setSelectedItem(item)}>
                                            <div className="flex items-center justify-between"><span className="font-medium text-sm text-slate-700 truncate">{item.title}</span>{item.comments.length > 0 && <div className="flex items-center text-gray-300 text-xs"><MessageSquare size={12} className="mr-1"/> {item.comments.length}</div>}</div>
                                        </td>
                                        {activeProject.columns.map(col => <td key={col.id} className="p-0 h-10 border-r border-gray-100 bg-white"><DynamicCell item={item} column={col} users={users} projectId={activeProject.id} updateItem={updateItem} updateColumn={updateColumn} canEdit={userCanEditItems} /></td>)}
                                        <td className="px-2 text-center"><button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50/50 hover:bg-gray-100 cursor-pointer"><td className="px-4 py-3 border-r border-gray-100 text-center text-gray-400"><Plus size={16}/></td><td className="px-4 py-3" colSpan={activeProject.columns.length + 2} onClick={() => handleCreateTicket()}><span className="text-sm text-gray-500 font-medium">Adicionar Nova Tarefa...</span></td></tr>
                            </tbody>
                        </table>
                    </div>
                ) : viewMode === 'timeline' ? (
                    <div className="h-full overflow-auto p-6 custom-scrollbar bg-gray-50/50">
                         <div className="bg-white rounded-lg shadow-sm border border-gray-200 inline-block min-w-full">
                             <div className="flex border-b border-gray-200 sticky top-0 bg-white z-20">
                                 <div className="w-[250px] p-3 border-r border-gray-200 font-bold text-gray-500 text-xs uppercase sticky left-0 bg-white z-30 shadow-sm flex-shrink-0">Tarefa</div>
                                 <div className="flex">
                                     {Array.from({length: 30}).map((_, i) => {
                                         const d = new Date(); d.setDate(d.getDate() - 5 + i);
                                         const isToday = d.toDateString() === new Date().toDateString();
                                         return <div key={i} className={`w-12 text-center p-2 border-r border-gray-100 flex-shrink-0 ${isToday ? 'bg-indigo-50' : (d.getDay()===0||d.getDay()===6) ? 'bg-gray-50' : ''}`}><div className={`text-[10px] uppercase font-bold mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>{d.toLocaleDateString(undefined, {weekday:'short'}).slice(0,3)}</div><div className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>{d.getDate()}</div></div>
                                     })}
                                 </div>
                             </div>
                             <div className="divide-y divide-gray-100">
                                 {items.map(item => {
                                     const dueDate = item.dueDate ? new Date(item.dueDate) : null;
                                     const timelineStart = new Date(); timelineStart.setDate(timelineStart.getDate() - 5); timelineStart.setHours(0,0,0,0);
                                     let markerStyle = {}; let hasValidDate = false;
                                     if (dueDate) {
                                         const offsetDays = Math.floor((dueDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
                                         if (offsetDays >= 0 && offsetDays < 30) {
                                             hasValidDate = true;
                                             markerStyle = { left: `${(offsetDays * 48) + 16}px` };
                                         }
                                     }
                                     return (
                                         <div key={item.id} className="flex relative h-12 hover:bg-gray-50 group">
                                             <div className="w-[250px] border-r border-gray-200 px-4 flex items-center text-sm font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-sm flex-shrink-0 cursor-pointer hover:text-indigo-600 truncate" onClick={() => setSelectedItem(item)}><span className="truncate">{item.title}</span></div>
                                             <div className="flex relative flex-grow">
                                                 <div className="absolute inset-0 flex pointer-events-none">{Array.from({length: 30}).map((_, i) => <div key={i} className="w-12 border-r border-gray-100 h-full flex-shrink-0"></div>)}</div>
                                                 {hasValidDate && <div className="absolute top-3 w-4 h-4 bg-indigo-500 rotate-45 shadow-sm cursor-pointer z-10 hover:scale-125 transition-transform" style={markerStyle} onClick={() => setSelectedItem(item)} title={`Entrega: ${dueDate?.toLocaleDateString()}`}></div>}
                                             </div>
                                         </div>
                                     )
                                 })}
                             </div>
                         </div>
                    </div>
                ) : (
                    <div className="h-full overflow-x-auto overflow-y-hidden whitespace-nowrap p-6 custom-scrollbar flex items-start space-x-6">
                        {groups.map((group, groupIndex) => (
                            <div key={group.id} className="w-[300px] flex flex-col max-h-full shrink-0">
                                <div className="flex items-center justify-between mb-3 px-1 relative group/header">
                                    <div className="flex items-center space-x-2">
                                        <div className="px-2 py-0.5 rounded text-white text-xs font-bold uppercase" style={{ backgroundColor: group.color }}>{group.label}</div>
                                        <span className="text-xs text-gray-400 font-bold">{groupedItems[group.id]?.length || 0}</span>
                                    </div>
                                    <div className="flex space-x-1 relative">
                                        {canEdit && group.id !== 'undefined' && group.id !== 'all' && (
                                            <button onClick={(e) => openGroupMenu(e, group.optionId!)} className="text-gray-300 hover:text-gray-500"><MoreHorizontal size={16}/></button>
                                        )}
                                        <button onClick={() => handleCreateTicket(group.id === 'undefined' ? undefined : group.id)} className="text-gray-300 hover:text-gray-500"><Plus size={16}/></button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-2 custom-scrollbar">
                                    {groupedItems[group.id]?.map(item => (
                                        <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group whitespace-normal relative">
                                             <div className="flex justify-between items-start mb-2">
                                                 <span className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">{item.title}</span>
                                                 <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 absolute top-2 right-2 p-1 bg-white rounded shadow-sm z-20"><Trash2 size={14}/></button>
                                             </div>
                                             <div className="space-y-2 mt-3">
                                                {activeProject.columns.filter(c => c.type !== 'status' && c.type !== 'text').slice(0, 3).map(col => {
                                                    const val = item.data[col.id];
                                                    if (!val) return null;
                                                    if (col.type === 'person') {
                                                        const u = users.find(user => user.id === val);
                                                        if (!u) return null;
                                                        return <div key={col.id} className="flex items-center"><img src={u.avatar} className="w-5 h-5 rounded-full mr-2"/><span className="text-xs text-gray-600">{u.name}</span></div>
                                                    }
                                                    if (col.type === 'date') return <div key={col.id} className="flex items-center text-xs text-gray-500"><Calendar size={12} className="mr-2"/> {new Date(val).toLocaleDateString()}</div>;
                                                    if (col.type === 'priority') {
                                                         const opt = col.options?.find(o => o.label === val);
                                                         return <div key={col.id} className="inline-block px-1.5 py-0.5 rounded text-[10px] text-white font-bold" style={{ backgroundColor: opt?.color || '#ccc' }}>{val}</div>
                                                    }
                                                    return null;
                                                })}
                                             </div>
                                             <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between text-gray-400">
                                                 <div className="flex items-center space-x-3 text-xs">
                                                     {item.description && <AlignLeft size={14} />}
                                                     {item.checklists && item.checklists.length > 0 && (<div className="flex items-center space-x-1"><CheckSquare size={14} /><span>{item.checklists.filter(c => c.done).length}/{item.checklists.length}</span></div>)}
                                                     {item.comments.length > 0 && (<div className="flex items-center space-x-1"><MessageSquare size={14} /><span>{item.comments.length}</span></div>)}
                                                 </div>
                                                 {item.assigneeId && <img src={users.find(u => u.id === item.assigneeId)?.avatar} className="w-5 h-5 rounded-full border border-white" title={users.find(u => u.id === item.assigneeId)?.name}/>}
                                             </div>
                                        </div>
                                    ))}
                                    <button onClick={() => handleCreateTicket(group.id === 'undefined' ? undefined : group.id)} className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition text-sm flex items-center justify-center"><Plus size={16} className="mr-1"/> Nova Tarefa</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>

             {/* FIXED KANBAN MENU */}
             {activeGroupMenu && statusCol && (
                 <div 
                    ref={groupMenuRef}
                    style={{ position: 'fixed', top: activeGroupMenu.top, left: activeGroupMenu.left, zIndex: 9999 }}
                    className="w-56 bg-white shadow-2xl rounded-lg border border-gray-100 py-1 text-left font-normal animate-fade-in"
                 >
                     <div className="p-3 border-b border-gray-100 bg-gray-50">
                         <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Editar Coluna</p>
                         <input 
                            type="text" 
                            className="w-full text-sm border border-gray-200 rounded p-1.5 bg-white outline-none focus:border-indigo-500" 
                            placeholder="Nome da coluna"
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateOption(statusCol.id, activeGroupMenu.optionId, e.currentTarget.value)}
                         />
                     </div>
                     {isAdmin && (
                         <div className="p-2 border-b border-gray-100 flex justify-between">
                             <button className="flex-1 flex justify-center p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30" disabled title="Mover para Esquerda"><MoveLeft size={14}/></button>
                             <div className="w-px bg-gray-200 mx-1"></div>
                             <button className="flex-1 flex justify-center p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30" disabled title="Mover para Direita"><MoveRight size={14}/></button>
                         </div>
                     )}
                     <button onClick={() => handleDeleteOption(statusCol.id, activeGroupMenu.optionId)} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 text-xs flex items-center"><Trash2 size={12} className="mr-2"/> Excluir Coluna</button>
                 </div>
             )}

             {/* FIXED HEADER MENU (For Table View) */}
             {activeHeaderMenu && (
                 <div 
                    ref={headerMenuRef}
                    style={{ position: 'fixed', top: activeHeaderMenu.top, left: activeHeaderMenu.left, zIndex: 9999 }}
                    className="w-56 bg-white shadow-2xl rounded-lg border border-gray-100 py-1 text-left font-normal animate-fade-in"
                 >
                     <div className="p-3 border-b border-gray-100 bg-gray-50">
                         <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Renomear Coluna</p>
                         <input 
                            type="text" 
                            autoFocus
                            className="w-full text-sm border border-gray-200 rounded p-1.5 bg-white outline-none focus:border-indigo-500" 
                            placeholder="Novo nome"
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn(activeHeaderMenu.colId, e.currentTarget.value)}
                         />
                     </div>
                     <button onClick={() => handleRenameColumn(activeHeaderMenu.colId, prompt('Novo nome:') || '')} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center text-gray-700"><Edit3 size={12} className="mr-2"/> Editar Nome</button>
                     <button onClick={() => handleDeleteColumn(activeHeaderMenu.colId)} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 text-xs flex items-center border-t border-gray-50 mt-1"><Trash2 size={12} className="mr-2"/> Excluir Coluna</button>
                 </div>
             )}

             {selectedItem && <ItemDetailModal item={selectedItem} project={activeProject} users={users} onClose={() => setSelectedItem(null)} updateItem={updateItem} updateColumn={updateColumn} addComment={addComment} archiveItem={archiveItem} deleteItem={deleteItem} canEdit={userCanEditItems} canDelete={canEdit} canArchive={canEdit} addColumn={addColumn} deleteColumn={deleteColumn} />}
             {isAutomationOpen && <AutomationModal project={activeProject} onClose={() => setIsAutomationOpen(false)} onSave={(rule) => addAutomation(activeProject.id, rule)} onDelete={(ruleId) => deleteAutomation(activeProject.id, ruleId)} />}
             {isMembersModalOpen && (
                 <div className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center backdrop-blur-sm">
                     <div className="bg-white rounded-lg shadow-2xl w-[400px] flex flex-col max-h-[80vh] animate-fade-in">
                         <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg"><h3 className="font-bold text-gray-800">Gerenciar Membros</h3><button onClick={() => setIsMembersModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button></div>
                         <div className="p-2 overflow-y-auto flex-1">
                             <div className="p-2"><input type="text" placeholder="Buscar usuário..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-indigo-500 mb-2"/></div>
                             {users.map(u => {
                                 const isMember = activeProject.members?.includes(u.id);
                                 return <div key={u.id} onClick={() => toggleMember(u.id)} className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer rounded"><div className="flex items-center space-x-3"><img src={u.avatar} className="w-8 h-8 rounded-full"/><div><p className="text-sm font-bold text-slate-800">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div></div><div className={`w-5 h-5 rounded border flex items-center justify-center ${isMember ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>{isMember && <Check size={14} className="text-white"/>}</div></div>
                             })}
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { StatBox } from '../components/ui/StatBox';
import { BarChart2, Users, CheckSquare, Calendar, Filter, Download, PieChart, Circle, Layout, ChevronDown, FileSpreadsheet, FileImage, FileText, Printer, Activity } from 'lucide-react';

export const Reports: React.FC = () => {
    const { users, projects } = useApp();
    
    // --- GLOBAL STATE ---
    // Default to last 30 days
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const defaultStartDate = d.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [selectedUserId, setSelectedUserId] = useState<string>('all');

    // --- DOWNLOAD MENU STATE ---
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);

    // --- CUSTOM REPORT STATE ---
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
    const [selectedColumnId, setSelectedColumnId] = useState<string>('');
    const [chartType, setChartType] = useState<'bar' | 'pie' | 'donut'>('bar');

    // Close download menu on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
                setIsDownloadOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- REAL ACTIVITY LOGIC ---
    // Instead of Mock Access Logs, we derive activity from Tasks and Comments
    const activityLogs = useMemo(() => {
        const logs: { id: string, date: string, userId: string, type: 'task_assigned' | 'comment' }[] = [];

        projects.forEach(p => {
            // Identify person columns to find assignees
            const personColIds = p.columns.filter(c => c.type === 'person').map(c => c.id);

            p.items.forEach(t => {
                if (t.archived) return;

                // 1. Task Activity (using startDate as proxy for 'active' date)
                if (t.startDate) {
                    let assignedUserIds: string[] = [];
                    
                    // Legacy Assignee
                    if (t.assigneeId) assignedUserIds.push(t.assigneeId);
                    
                    // Dynamic Person Columns
                    personColIds.forEach(colId => {
                        const val = t.data[colId];
                        if (Array.isArray(val)) assignedUserIds.push(...val);
                        else if (typeof val === 'string' && val) assignedUserIds.push(val);
                    });

                    // Dedupe
                    assignedUserIds = [...new Set(assignedUserIds)];

                    assignedUserIds.forEach(uid => {
                        logs.push({
                            id: `task_${t.id}_${uid}`,
                            date: t.startDate,
                            userId: uid,
                            type: 'task_assigned'
                        });
                    });
                }

                // 2. Comments Activity
                t.comments.forEach(c => {
                    logs.push({
                        id: `comment_${c.id}`,
                        date: c.createdAt.split('T')[0], // Extract YYYY-MM-DD
                        userId: c.userId,
                        type: 'comment'
                    });
                });
            });
        });

        return logs.sort((a,b) => a.date.localeCompare(b.date));
    }, [projects]);

    // --- FILTERING ---
    
    const filteredActivity = useMemo(() => {
        return activityLogs.filter(log => {
            const dateMatch = log.date >= startDate && log.date <= endDate;
            const userMatch = selectedUserId === 'all' || log.userId === selectedUserId;
            return dateMatch && userMatch;
        });
    }, [activityLogs, startDate, endDate, selectedUserId]);

    // --- METRICS CALCULATION (KPIs) ---

    const totalInteractions = filteredActivity.length;
    
    const uniqueActiveUsersSet = new Set(filteredActivity.map(l => l.userId));
    const activeUsersCount = uniqueActiveUsersSet.size;
    
    const tasksInPeriod = filteredActivity.filter(l => l.type === 'task_assigned').length;
    const commentsInPeriod = filteredActivity.filter(l => l.type === 'comment').length;

    // Top 5 Users by Activity
    const topUsers = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredActivity.forEach(log => {
            // Count generic activity
            counts[log.userId] = (counts[log.userId] || 0) + 1;
        });
        
        return Object.entries(counts)
            .map(([uid, count]) => ({ 
                user: users.find(u => u.id === uid), 
                count 
            }))
            .filter(item => item.user)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [filteredActivity, users]);

    // Daily Activity Data for Chart
    const dailyActivityData = useMemo(() => {
        const data: Record<string, number> = {};
        let curr = new Date(startDate);
        const end = new Date(endDate);
        
        // Initialize all days with 0
        while(curr <= end) {
            data[curr.toISOString().split('T')[0]] = 0;
            curr.setDate(curr.getDate() + 1);
        }

        // Fill with data
        filteredActivity.forEach(log => {
            const day = log.date; // already YYYY-MM-DD
            if (data[day] !== undefined) {
                data[day]++;
            }
        });

        return Object.entries(data).map(([date, count]) => ({ date, count }));
    }, [filteredActivity, startDate, endDate]);

    const maxDailyActivity = Math.max(...dailyActivityData.map(d => d.count), 1);


    // --- CUSTOM CHART LOGIC ---
    
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    
    // Auto-select first suitable column (status, dropdown, priority) when project changes
    useMemo(() => {
        if (selectedProject && !selectedColumnId) {
            const suitableCol = selectedProject.columns.find(c => ['status', 'priority', 'dropdown', 'person'].includes(c.type));
            if (suitableCol) setSelectedColumnId(suitableCol.id);
        }
    }, [selectedProject]);

    const customChartData = useMemo(() => {
        if (!selectedProject || !selectedColumnId) return [];

        const col = selectedProject.columns.find(c => c.id === selectedColumnId);
        if (!col) return [];

        const counts: Record<string, number> = {};
        let total = 0;

        selectedProject.items.forEach(item => {
            let value = item.data[selectedColumnId];
            
            // Normalize value display
            if (Array.isArray(value)) value = value.length > 0 ? 'Vários' : 'Vazio';
            if (!value) value = 'Vazio';
            
            // If it's a person column, map ID to Name
            if (col.type === 'person' && value !== 'Vazio' && value !== 'Vários') {
                const u = users.find(user => user.id === value);
                value = u ? u.name : 'Desconhecido';
            }

            counts[value] = (counts[value] || 0) + 1;
            total++;
        });

        // Map to array with colors
        return Object.entries(counts).map(([label, count], index) => {
            // Try to find color from column options
            const option = col.options?.find(o => o.label === label);
            // Fallback colors
            const fallbackColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
            
            return {
                label,
                count,
                percentage: total > 0 ? (count / total) * 100 : 0,
                color: option ? option.color : fallbackColors[index % fallbackColors.length]
            };
        }).sort((a,b) => b.count - a.count);

    }, [selectedProject, selectedColumnId, users]);


    // Helper to generate Conic Gradient for Pie/Donut
    const getConicGradient = (data: typeof customChartData) => {
        let gradientString = 'conic-gradient(';
        let currentDeg = 0;
        
        data.forEach((d, i) => {
            const deg = (d.percentage / 100) * 360;
            gradientString += `${d.color} ${currentDeg}deg ${currentDeg + deg}deg${i === data.length - 1 ? '' : ', '}`;
            currentDeg += deg;
        });
        
        gradientString += ')';
        return gradientString;
    };

    // --- EXPORT HANDLERS ---
    const handleExport = (type: 'csv' | 'jpeg' | 'pdf') => {
        setIsDownloadOpen(false);
        
        if (type === 'csv') {
            // Generate CSV for current Project Analysis
            if(customChartData.length === 0) {
                alert("Não há dados no gráfico para exportar.");
                return;
            }
            
            const headers = ["Categoria/Label", "Quantidade", "Porcentagem"];
            const rows = customChartData.map(d => [
                `"${d.label}"`, 
                d.count, 
                `"${d.percentage.toFixed(2)}%"`
            ]);
            
            const csvContent = "data:text/csv;charset=utf-8," 
                + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
                
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `relatorio_${selectedProject?.title.replace(/\s+/g, '_').toLowerCase()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } else if (type === 'pdf') {
            // Use browser print to PDF
            window.print();
        } else if (type === 'jpeg') {
            // Mocking Image Download (requires html2canvas normally)
            alert("A funcionalidade de exportação direta para imagem requer bibliotecas adicionais. Por favor, utilize a captura de tela ou a opção 'Salvar como PDF' na impressão.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10 print:p-0">
            {/* Header & Global Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <BarChart2 className="mr-2 text-indigo-600"/> Relatórios Gerenciais
                    </h2>
                    <p className="text-sm text-gray-500">Analise a produtividade e dados reais dos quadros.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm relative z-20">
                    <div className="flex items-center space-x-2 px-2 border-r border-gray-200 pr-4">
                        <Filter size={16} className="text-indigo-600"/>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Filtros</span>
                    </div>
                    
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">De</span>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none text-gray-700 shadow-sm"
                        />
                    </div>
                    
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Até</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none text-gray-700 shadow-sm"
                        />
                    </div>

                    <div className="flex flex-col">
                         <span className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Usuário</span>
                         <select 
                            value={selectedUserId} 
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="text-sm bg-white border border-gray-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none text-gray-700 shadow-sm min-w-[150px]"
                        >
                            <option value="all">Todos os Usuários</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Download Dropdown */}
                    <div className="relative ml-2" ref={downloadMenuRef}>
                        <button 
                            onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                            className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 hover:text-indigo-600 hover:border-indigo-300 px-3 py-2 rounded-md shadow-sm transition font-medium text-sm"
                        >
                            <Download size={16}/> <span>Baixar</span> <ChevronDown size={14} className={`transform transition ${isDownloadOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isDownloadOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-fade-in">
                                <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-50">Formato de Exportação</p>
                                
                                <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center text-gray-700 group">
                                    <FileSpreadsheet size={16} className="mr-2 text-green-500 group-hover:scale-110 transition-transform"/> Tabela (CSV)
                                </button>
                                
                                <button onClick={() => handleExport('jpeg')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center text-gray-700 group">
                                    <FileImage size={16} className="mr-2 text-blue-500 group-hover:scale-110 transition-transform"/> Imagem (JPEG)
                                </button>
                                
                                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center text-gray-700 group">
                                    <FileText size={16} className="mr-2 text-red-500 group-hover:scale-110 transition-transform"/> Documento (PDF)
                                </button>
                                
                                <div className="border-t border-gray-50 mt-1">
                                    <button onClick={() => window.print()} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs flex items-center text-gray-500">
                                        <Printer size={14} className="mr-2"/> Imprimir Página
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Engajamento" className="border-t-4 border-t-indigo-500">
                    <div className="flex items-center justify-between">
                        <StatBox icon={Activity} label="Interações Totais" value={totalInteractions} color="text-indigo-600" />
                        <div className="text-right">
                            <span className="text-xs text-gray-400 font-medium block">Comentários: {commentsInPeriod}</span>
                            <span className="text-xs text-gray-400 font-medium block">Tarefas: {tasksInPeriod}</span>
                        </div>
                    </div>
                </Card>
                <Card title="Usuários Ativos" className="border-t-4 border-t-emerald-500">
                    <div className="flex items-center justify-between">
                        <StatBox icon={Users} label="Participantes Únicos" value={activeUsersCount} color="text-emerald-600" />
                        <div className="text-right">
                            <span className="text-xs text-gray-400">Total cadastrados: {users.length}</span>
                        </div>
                    </div>
                </Card>
                <Card title="Tarefas" className="border-t-4 border-t-blue-500">
                    <div className="flex items-center justify-between">
                        <StatBox icon={CheckSquare} label="Tarefas Movimentadas" value={tasksInPeriod} color="text-blue-600" />
                         <div className="text-right">
                            <span className="text-xs text-green-500 font-bold flex items-center justify-end">
                                Real
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Activity Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 break-inside-avoid">
                {/* Activity Timeline Chart */}
                <div className="lg:col-span-2">
                    <Card title="Volume de Atividade Diária" className="h-full">
                        <div className="h-64 flex items-end space-x-1 sm:space-x-2 pt-6">
                            {dailyActivityData.map((data, idx) => {
                                const heightPercentage = (data.count / maxDailyActivity) * 100;
                                const isWeekend = new Date(data.date).getDay() === 0 || new Date(data.date).getDay() === 6;
                                
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                        <div 
                                            className={`w-full rounded-t-sm transition-all duration-500 ${isWeekend ? 'bg-gray-200' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                                            style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                                        ></div>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-800 text-white text-xs rounded p-2 z-10 whitespace-nowrap shadow-xl">
                                            <span className="font-bold">{new Date(data.date).toLocaleDateString()}</span>
                                            <span>{data.count} ações</span>
                                            <div className="w-2 h-2 bg-slate-800 rotate-45 absolute -bottom-1"></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-400 border-t pt-2">
                            <span>{new Date(startDate).toLocaleDateString()}</span>
                            <span>{new Date(endDate).toLocaleDateString()}</span>
                        </div>
                    </Card>
                </div>

                {/* Top Users List */}
                <div className="lg:col-span-1">
                    <Card title="Top 5 Usuários Mais Produtivos" className="h-full">
                        <div className="space-y-4">
                            {topUsers.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-10">Nenhuma atividade registrada no período.</p>
                            ) : (
                                topUsers.map((item, idx) => (
                                    <div key={item.user?.id} className="relative">
                                        <div className="flex items-center justify-between mb-1 relative z-10">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-200 text-slate-500'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <img src={item.user?.avatar} className="w-8 h-8 rounded-full border border-gray-100" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 leading-none">{item.user?.name}</p>
                                                        <p className="text-[10px] text-gray-400">{item.user?.jobTitle || 'Membro'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-bold text-indigo-600">{item.count} <span className="text-[10px] text-gray-400 font-normal">ações</span></div>
                                        </div>
                                        {/* Progress Bar Background */}
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                            <div 
                                                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000" 
                                                style={{ width: `${(item.count / (topUsers[0].count || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Custom Project Analysis Section */}
            <Card title="Análise Detalhada de Projetos" className="border-t-4 border-t-purple-500 break-inside-avoid">
                <div className="flex flex-col space-y-6">
                    {/* Controls */}
                    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 print:hidden">
                        <div className="flex flex-col min-w-[200px]">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Selecione o Projeto</label>
                            <select 
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 shadow-sm"
                            >
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col min-w-[200px]">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Agrupar Por (Coluna)</label>
                            <select 
                                value={selectedColumnId}
                                onChange={(e) => setSelectedColumnId(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 shadow-sm"
                            >
                                <option value="">Selecione uma coluna...</option>
                                {selectedProject?.columns
                                    .filter(c => ['status', 'priority', 'dropdown', 'person'].includes(c.type))
                                    .map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                                }
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Gráfico</label>
                            <div className="flex bg-white rounded border border-gray-300 p-1 shadow-sm">
                                <button 
                                    onClick={() => setChartType('bar')}
                                    className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Barras"
                                >
                                    <Layout size={18} />
                                </button>
                                <button 
                                    onClick={() => setChartType('pie')}
                                    className={`p-1.5 rounded ${chartType === 'pie' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Pizza"
                                >
                                    <PieChart size={18} />
                                </button>
                                <button 
                                    onClick={() => setChartType('donut')}
                                    className={`p-1.5 rounded ${chartType === 'donut' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Rosca"
                                >
                                    <Circle size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Chart Visualization Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[300px]">
                        {customChartData.length > 0 ? (
                            <>
                                {/* Graphic Render */}
                                <div className="flex justify-center items-center h-full p-4">
                                    {chartType === 'bar' && (
                                        <div className="w-full h-64 flex items-end space-x-4">
                                            {customChartData.map((d, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                                    <div className="text-xs font-bold text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</div>
                                                    <div 
                                                        className="w-full rounded-t-md transition-all duration-500 hover:opacity-80"
                                                        style={{ height: `${d.percentage}%`, backgroundColor: d.color }}
                                                    ></div>
                                                    <span className="mt-2 text-[10px] text-gray-500 font-medium truncate w-full text-center" title={d.label}>{d.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(chartType === 'pie' || chartType === 'donut') && (
                                        <div className="relative w-64 h-64 rounded-full shadow-lg"
                                             style={{ background: getConicGradient(customChartData) }}
                                        >
                                            {chartType === 'donut' && (
                                                <div className="absolute inset-0 m-auto bg-white rounded-full w-32 h-32 flex items-center justify-center shadow-inner">
                                                    <div className="text-center">
                                                        <span className="block text-2xl font-bold text-gray-700">{selectedProject?.items.length}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase">Total Items</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Legend / Table */}
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 h-full overflow-y-auto max-h-[300px]">
                                    <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Distribuição de Dados</h4>
                                    <div className="space-y-3">
                                        {customChartData.map((d, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                                    <span className="text-sm text-gray-600 font-medium">{d.label}</span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-xs font-bold text-gray-400">{d.percentage.toFixed(1)}%</span>
                                                    <span className="text-sm font-bold text-slate-800 w-8 text-right">{d.count}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-3 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Total</span>
                                        <span className="text-lg font-bold text-indigo-600">{selectedProject?.items.length}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="col-span-2 flex flex-col items-center justify-center text-gray-400 h-full py-10">
                                <BarChart2 size={48} className="mb-2 opacity-20"/>
                                <p>Selecione um projeto e uma coluna para visualizar a análise.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
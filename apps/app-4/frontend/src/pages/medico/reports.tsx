import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    FileText, Calendar, Loader2, ArrowLeft, Download,
    Users, Clock, TrendingUp, Filter, Printer
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
    period: { start: string; end: string };
    summary: {
        totalAppointments: number;
        completedAppointments: number;
        cancelledAppointments: number;
        totalPatients: number;
        totalPrescriptions: number;
        totalRecords: number;
        averageConsultationTime: number;
        revenue: number;
    };
    appointmentsByDay: { date: string; count: number }[];
    topDiagnoses: { diagnosis: string; count: number }[];
    patientsByAge: { range: string; count: number }[];
}

export default function DoctorReportsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('month');
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadReport();
    }, [isAuthenticated, startDate, endDate]);

    useEffect(() => {
        const today = new Date();
        if (dateRange === 'week') {
            setStartDate(format(startOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd'));
            setEndDate(format(endOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd'));
        } else if (dateRange === 'month') {
            setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
            setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        }
    }, [dateRange]);

    const loadReport = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/stats/doctor-report?start=${startDate}&end=${endDate}`);
            setReport(response.data);
        } catch (err) {
            // Mock data for demo
            setReport({
                period: { start: startDate, end: endDate },
                summary: {
                    totalAppointments: 45,
                    completedAppointments: 42,
                    cancelledAppointments: 3,
                    totalPatients: 38,
                    totalPrescriptions: 35,
                    totalRecords: 42,
                    averageConsultationTime: 25,
                    revenue: 4500
                },
                appointmentsByDay: [
                    { date: '2024-12-09', count: 8 },
                    { date: '2024-12-10', count: 7 },
                    { date: '2024-12-11', count: 9 },
                    { date: '2024-12-12', count: 6 },
                    { date: '2024-12-13', count: 8 },
                    { date: '2024-12-14', count: 4 },
                    { date: '2024-12-15', count: 3 },
                ],
                topDiagnoses: [
                    { diagnosis: 'Infecção respiratória', count: 12 },
                    { diagnosis: 'Hipertensão', count: 8 },
                    { diagnosis: 'Diabetes tipo 2', count: 6 },
                    { diagnosis: 'Ansiedade', count: 5 },
                    { diagnosis: 'Lombalgia', count: 4 },
                ],
                patientsByAge: [
                    { range: '0-18', count: 5 },
                    { range: '19-35', count: 12 },
                    { range: '36-50', count: 15 },
                    { range: '51-65', count: 8 },
                    { range: '65+', count: 5 },
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        if (!report) return;
        
        const csvContent = [
            ['Relatório de Atendimentos'],
            [`Período: ${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')}`],
            [''],
            ['Resumo'],
            ['Total de Consultas', report.summary.totalAppointments],
            ['Consultas Concluídas', report.summary.completedAppointments],
            ['Consultas Canceladas', report.summary.cancelledAppointments],
            ['Total de Pacientes', report.summary.totalPatients],
            ['Receitas Emitidas', report.summary.totalPrescriptions],
            ['Prontuários Criados', report.summary.totalRecords],
            ['Tempo Médio de Consulta (min)', report.summary.averageConsultationTime],
            [''],
            ['Diagnósticos Mais Frequentes'],
            ...report.topDiagnoses.map(d => [d.diagnosis, d.count]),
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_${startDate}_${endDate}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
        );
    }

    const maxDayCount = report ? Math.max(...report.appointmentsByDay.map(d => d.count)) : 10;

    return (
        <>
            <Head>
                <title>Relatórios | MediSync</title>
            </Head>

            <div className="max-w-6xl mx-auto p-6 space-y-6 print:p-0">
                {/* Back Button - hide on print */}
                <button
                    onClick={() => router.push('/medico/dashboard')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors print:hidden"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Dashboard
                </button>

                {/* Header */}
                <div className="flex items-center justify-between print:block">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <FileText className="w-7 h-7 text-cyan-600" />
                            Relatório de Atendimentos
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {format(new Date(startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(endDate), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                    </div>
                    <div className="flex gap-2 print:hidden">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
                        >
                            <Download className="w-5 h-5" />
                            Exportar CSV
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium"
                        >
                            <Printer className="w-5 h-5" />
                            Imprimir
                        </button>
                    </div>
                </div>

                {/* Date Range Filter - hide on print */}
                <div className="flex flex-wrap gap-4 items-center print:hidden">
                    <div className="flex gap-2">
                        {(['week', 'month', 'custom'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    dateRange === range
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {range === 'week' ? 'Esta Semana' : range === 'month' ? 'Este Mês' : 'Personalizado'}
                            </button>
                        ))}
                    </div>
                    {dateRange === 'custom' && (
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                            />
                            <span className="text-gray-500">até</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                            />
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-cyan-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{report?.summary.totalAppointments || 0}</p>
                                <p className="text-xs text-gray-500">Consultas</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{report?.summary.totalPatients || 0}</p>
                                <p className="text-xs text-gray-500">Pacientes</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{report?.summary.averageConsultationTime || 0}min</p>
                                <p className="text-xs text-gray-500">Tempo Médio</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {report ? ((report.summary.completedAppointments / report.summary.totalAppointments) * 100).toFixed(0) : 0}%
                                </p>
                                <p className="text-xs text-gray-500">Taxa Conclusão</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Appointments by Day Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Consultas por Dia
                        </h3>
                        <div className="flex items-end gap-2 h-48">
                            {report?.appointmentsByDay.map((day, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div 
                                        className="w-full bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t-lg transition-all hover:from-cyan-500 hover:to-blue-400"
                                        style={{ height: `${(day.count / maxDayCount) * 100}%`, minHeight: '10px' }}
                                    />
                                    <span className="text-xs text-gray-500">
                                        {format(new Date(day.date), 'dd/MM')}
                                    </span>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{day.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Diagnoses */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Diagnósticos Mais Frequentes
                        </h3>
                        <div className="space-y-3">
                            {report?.topDiagnoses.map((item, index) => {
                                const maxCount = report.topDiagnoses[0]?.count || 1;
                                const percentage = ((item.count / maxCount) * 100).toFixed(0);
                                return (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{item.diagnosis}</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{item.count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-cyan-500 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Patients by Age */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Distribuição por Faixa Etária
                    </h3>
                    <div className="flex items-end justify-around h-40">
                        {report?.patientsByAge.map((item, index) => {
                            const maxCount = Math.max(...(report?.patientsByAge.map(p => p.count) || [1]));
                            return (
                                <div key={index} className="flex flex-col items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.count}</span>
                                    <div 
                                        className="w-16 bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg"
                                        style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: '20px' }}
                                    />
                                    <span className="text-xs text-gray-500">{item.range}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detailed Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Resumo Detalhado
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-sm text-gray-500 mb-1">Consultas Concluídas</p>
                            <p className="text-xl font-bold text-emerald-600">{report?.summary.completedAppointments || 0}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-sm text-gray-500 mb-1">Consultas Canceladas</p>
                            <p className="text-xl font-bold text-red-600">{report?.summary.cancelledAppointments || 0}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-sm text-gray-500 mb-1">Receitas Emitidas</p>
                            <p className="text-xl font-bold text-blue-600">{report?.summary.totalPrescriptions || 0}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-sm text-gray-500 mb-1">Prontuários Criados</p>
                            <p className="text-xl font-bold text-purple-600">{report?.summary.totalRecords || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

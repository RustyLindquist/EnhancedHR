'use client';

import React, { useState } from 'react';
import { Play, Database, AlertTriangle, CheckCircle, Terminal, RefreshCw, Server, Video, Search } from 'lucide-react';

export default function SystemPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [sqlQuery, setSqlQuery] = useState('SELECT * FROM auth.users LIMIT 5;');
    const [activeTab, setActiveTab] = useState<'actions' | 'sql'>('actions');

    const runAction = async (endpoint: string, method: string = 'POST', body?: any) => {
        setIsLoading(true);
        setResult(null);
        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            setResult({ error: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    const runSql = async () => {
        await runAction('/api/admin/run-sql', 'POST', { query: sqlQuery });
    };

    const PRESET_QUERIES = [
        { label: 'Check Auth Triggers', query: "select event_object_schema, event_object_table, trigger_name, action_statement from information_schema.triggers where event_object_schema = 'auth';" },
        { label: 'Check Users (Instance IDs)', query: "select instance_id, count(*), max(email) from auth.users group by instance_id;" },
        { label: 'Check Profiles vs Users', query: "select count(*) as users from auth.users union all select count(*) as profiles from public.profiles;" },
        { label: 'List Demo Users', query: "select email, id, instance_id, role from auth.users where email like 'demo.%';" },
    ];

    return (
        <div className="space-y-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        System Tools
                    </h1>
                    <p className="text-slate-400 mt-2">Manage database, seed data, and run diagnostics.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('actions')}
                    className={`pb-4 px-4 text-sm font-medium transition-colors ${activeTab === 'actions' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Quick Actions
                </button>
                <button
                    onClick={() => setActiveTab('sql')}
                    className={`pb-4 px-4 text-sm font-medium transition-colors ${activeTab === 'sql' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    SQL Console
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Controls */}
                <div className="space-y-6">

                    {activeTab === 'actions' && (
                        <div className="space-y-6">
                            {/* Seed Card */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">Seed Demo Accounts</h3>
                                            <p className="text-sm text-slate-400">Create or update the 5 demo users via Admin API.</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => runAction('/api/admin/seed-demo-users')}
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    Run Seed Script
                                </button>
                            </div>

                            {/* Health Check Card */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">Database Health Check</h3>
                                            <p className="text-sm text-slate-400">Run basic connectivity and schema checks.</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => runAction('/api/debug-db', 'GET')}
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                                    Run Diagnostics
                                </button>
                            </div>

                            {/* Fix Video URLs Card */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                                            <Video className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">Fix Broken Video URLs</h3>
                                            <p className="text-sm text-slate-400">Convert Mux upload IDs to playback IDs in course lessons.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => runAction('/api/admin/fix-video-urls', 'GET')}
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        Find Broken
                                    </button>
                                    <button
                                        onClick={() => runAction('/api/admin/fix-video-urls', 'POST')}
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                        Fix All
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sql' && (
                        <div className="space-y-6">
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                        <Terminal className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold">SQL Console</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_QUERIES.map((preset, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSqlQuery(preset.query)}
                                                className="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        value={sqlQuery}
                                        onChange={(e) => setSqlQuery(e.target.value)}
                                        className="w-full h-48 bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-green-400 focus:outline-none focus:border-blue-500 resize-none"
                                        placeholder="Enter SQL query..."
                                    />

                                    <button
                                        onClick={runSql}
                                        disabled={isLoading}
                                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                        Execute Query
                                    </button>

                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Connects directly via DATABASE_URL. Use with caution.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column: Results */}
                <div className="h-full min-h-[500px] p-6 rounded-xl bg-black/80 border border-white/10 font-mono text-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                        <span className="text-slate-400">Output</span>
                        {result && (
                            <span className={`text-xs px-2 py-1 rounded ${result.error ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {result.error ? 'Error' : 'Success'}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                                <span>Processing...</span>
                            </div>
                        ) : result ? (
                            <pre className="text-slate-300 whitespace-pre-wrap">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-600">
                                No output to display
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

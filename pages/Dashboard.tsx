import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Tank, Zone } from '../types';
import ZoneModal from '../components/ZoneModal';

interface DashboardProps {
  zones: Zone[];
  inventory: Tank[];
  isAdmin: boolean;
  onMoveOut: (id: string, zoneName: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC<DashboardProps> = ({ zones, inventory, isAdmin, onMoveOut }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const totalCapacity = zones.reduce((acc, curr) => acc + parseInt(curr.limit.toString()), 0);
  const currentCount = inventory.length;

  const getZoneStats = (zoneId: string) => {
    const items = inventory.filter((t) => t.zone === zoneId);
    const displayedItems = items.filter(
      (t) =>
        t.id.toUpperCase().includes(searchTerm.toUpperCase()) ||
        t.content.toUpperCase().includes(searchTerm.toUpperCase())
    );
    return { items, displayedItems, count: items.length };
  };

  const chartData = zones.map(z => ({
    name: z.name,
    value: inventory.filter(t => t.zone === z.id).length
  })).filter(d => d.value > 0);

  const handleZoneClick = (zoneId: string) => {
    setSelectedZoneId(zoneId);
  };

  const selectedZone = selectedZoneId ? zones.find(z => z.id === selectedZoneId) || null : null;
  const selectedZoneTanks = selectedZoneId ? inventory.filter(t => t.zone === selectedZoneId) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-bold uppercase">總容量 (Total Capacity)</div>
          <div className="text-3xl font-bold text-slate-700">{totalCapacity}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-bold uppercase">在庫數 (In Stock)</div>
          <div className="text-3xl font-bold text-amber-600">{currentCount}</div>
        </div>
        
        {/* Simple Pie Chart Visualization */}
        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 col-span-1 md:col-span-2 flex items-center justify-center h-32 md:h-auto">
             {chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '10px'}} />
                    </PieChart>
                 </ResponsiveContainer>
             ) : (
                 <div className="text-xs text-slate-400">無資料</div>
             )}
        </div>
      </div>

       {/* Search Bar */}
       <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 flex items-center px-4">
          <i className="fa-solid fa-search text-slate-300 mr-3"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none bg-transparent"
            placeholder="搜尋槽號、內容物..."
          />
        </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => {
          const { items, displayedItems, count } = getZoneStats(zone.id);
          const limit = parseInt(zone.limit.toString());
          const pct = limit > 0 ? Math.round((count / limit) * 100) : 0;
          const colorClass = pct >= 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-blue-500';

          return (
            <div key={zone.id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col h-[350px]">
              <div
                onClick={() => handleZoneClick(zone.id)}
                className="p-3 bg-slate-50 border-b flex justify-between items-center shrink-0 cursor-pointer hover:bg-blue-50 transition group select-none"
              >
                <div className="font-bold text-slate-700 group-hover:text-blue-700 flex items-center gap-2">
                  {zone.name}
                  <i className="fa-solid fa-up-right-from-square text-xs text-slate-300 group-hover:text-blue-400"></i>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded bg-white border text-slate-500 group-hover:border-blue-200 group-hover:text-blue-600">
                  {count}/{limit}
                </span>
              </div>
              
              <div className="h-1 w-full bg-slate-200 shrink-0">
                <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
              </div>

              <div className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
                {displayedItems.length === 0 ? (
                  <div className="text-center text-slate-300 py-4 text-xs">
                    {searchTerm ? '無符合結果' : '空區域'}
                  </div>
                ) : (
                  displayedItems.map((tank) => (
                    <div
                      key={tank.id}
                      className="flex justify-between items-start text-sm border-b border-slate-100 py-2 last:border-0 hover:bg-slate-50 px-2 rounded transition"
                    >
                      <div className="flex-1">
                        <div className="font-bold font-mono text-slate-700 text-base">{tank.id}</div>
                        <div className="text-[11px] text-slate-400 my-0.5">
                          <i className="fa-regular fa-clock mr-1"></i>
                          {tank.time}
                        </div>
                        <div className="text-xs text-slate-500 font-bold truncate max-w-[120px]">
                          {tank.content}
                        </div>
                        <div className="text-xs text-blue-600 font-bold mt-0.5">
                          <i className="fa-solid fa-weight-hanging mr-1"></i>
                          {Number(tank.weight).toLocaleString()} kg
                          {tank.remark && (
                            <i className="fa-solid fa-circle-info ml-1 text-slate-400" title={tank.remark}></i>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`確定將 ${tank.id} 移出 ${zone.name}？`)) {
                              onMoveOut(tank.id, zone.name);
                            }
                          }}
                          className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 mt-1 shrink-0"
                        >
                          移出
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ZoneModal
        isOpen={!!selectedZone}
        onClose={() => setSelectedZoneId(null)}
        zone={selectedZone}
        tanks={selectedZoneTanks}
        isAdmin={isAdmin}
        onMoveOut={(id, zoneName) => {
           if(window.confirm(`確定將 ${id} 移出 ${zoneName}？`)) {
               onMoveOut(id, zoneName);
           }
        }}
      />
    </div>
  );
};

export default Dashboard;
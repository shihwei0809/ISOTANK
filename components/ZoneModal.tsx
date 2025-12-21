import React from 'react';
import { Tank, Zone } from '../types';

interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: Zone | null;
  tanks: Tank[];
  isAdmin: boolean;
  onMoveOut: (tankId: string, zoneName: string) => void;
}

const ZoneModal: React.FC<ZoneModalProps> = ({ isOpen, onClose, zone, tanks, isAdmin, onMoveOut }) => {
  if (!isOpen || !zone) return null;

  const count = tanks.length;
  const utilization = Math.round((count / zone.limit) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/75 transition-opacity" onClick={onClose}></div>

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-4xl flex flex-col max-h-[90vh]">
          <div className="bg-slate-50 px-4 py-4 sm:px-6 border-b border-slate-200 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-xl font-bold leading-6 text-slate-900">{zone.name} ({zone.id})</h3>
              <p className="mt-1 text-sm text-slate-500">
                容量: <span className="font-bold text-slate-800">{count}</span> / {zone.limit} (使用率 {utilization}%)
              </p>
            </div>
            <button
              type="button"
              className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none"
              onClick={onClose}
            >
              <i className="fa-solid fa-xmark text-2xl"></i>
            </button>
          </div>

          <div className="px-4 py-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
            {tanks.length === 0 ? (
              <div className="text-center text-slate-400 py-10">此區域無槽車</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tanks.map((tank) => (
                  <div key={tank.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-lg font-mono text-slate-800">{tank.id}</div>
                        <div className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{tank.time.split(' ')[0]}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-slate-600">
                          <i className="fa-solid fa-flask w-6 text-center text-slate-400"></i>
                          <span className="font-bold">{tank.content}</span>
                        </div>
                        <div className="flex items-center text-sm text-blue-600">
                          <i className="fa-solid fa-weight-hanging w-6 text-center"></i>
                          <span className="font-bold">{Number(tank.weight).toLocaleString()} kg</span>
                        </div>
                        {tank.remark && (
                          <div className="flex items-start text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
                            <i className="fa-solid fa-circle-info mt-0.5 mr-2"></i>
                            <span>{tank.remark}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => onMoveOut(tank.id, zone.name)}
                          className="bg-white text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-400 font-bold py-2 px-4 rounded text-sm transition flex items-center w-full justify-center sm:w-auto"
                        >
                          <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i> 移出
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100 shrink-0">
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneModal;
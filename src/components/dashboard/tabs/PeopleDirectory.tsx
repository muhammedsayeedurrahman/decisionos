'use client';

import React, { useState } from 'react';
import { TEAM, TeamMember } from '@/config/team';

const AVATAR_COLORS = ['bg-brand-red', 'bg-brand-blue', 'bg-green-600', 'bg-brand-yellow', 'bg-purple-600'];

interface PeopleDirectoryProps {
  canAdd: boolean;
  onAdd?: () => void;
}

export default function PeopleDirectory({ canAdd, onAdd }: PeopleDirectoryProps) {
  const [team, setTeam] = useState<TeamMember[]>(TEAM);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !email) return;
    setTeam(prev => [
      ...prev,
      { name, role: role.toUpperCase(), email, phone: '+91 98765 44000', color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] },
    ]);
    setName('');
    setRole('');
    setEmail('');
    setShowModal(false);
    onAdd?.();
  };

  return (
    <div className="w-full space-y-6 animate-fade-up">
      {canAdd && (
        <div className="flex items-center justify-between">
          <p className="label-mono text-brand-red">शर्मा Textiles Team Directory</p>
          <button onClick={() => setShowModal(true)} className="bg-brand-red text-white text-xs font-mono font-bold px-3 py-1.5 border border-zinc-950 dark:border-zinc-700 rounded hover:shadow-brutal cursor-pointer">
            + Add Member
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {team.map((p, i) => (
          <div key={i} className="person-card">
            <div className={`person-avatar ${p.color} text-white`}>
              {p.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="person-name">{p.name}</p>
              <p className="person-role">{p.role}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-950 dark:border-zinc-700 p-6 w-[90%] max-w-[400px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <h3 className="font-logo text-lg font-black uppercase mb-2 dark:text-white">Add Team Contact</h3>
            <form onSubmit={handleAddPerson} className="space-y-3">
              <input type="text" required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-zinc-300 dark:border-zinc-700 p-2.5 text-xs font-mono bg-white dark:bg-zinc-950 dark:text-white rounded" />
              <input type="text" required placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-zinc-300 dark:border-zinc-700 p-2.5 text-xs font-mono bg-white dark:bg-zinc-950 dark:text-white rounded" />
              <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-zinc-300 dark:border-zinc-700 p-2.5 text-xs font-mono bg-white dark:bg-zinc-950 dark:text-white rounded" />
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-mono font-bold uppercase rounded dark:text-zinc-200 cursor-pointer">Cancel</button>
                <button type="submit" className="bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 text-white dark:text-zinc-950 px-4 py-2 text-xs font-mono font-bold uppercase rounded cursor-pointer">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

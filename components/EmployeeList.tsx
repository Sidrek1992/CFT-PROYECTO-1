import React, { useState, useEffect, useRef } from 'react';
import { EmployeeExtended as Employee } from '../types';
import {
  Search, MoreHorizontal, UserPlus, X, Edit, Trash2, ArrowUpDown,
  Mail, Phone, Briefcase, Building, Calendar, ShieldCheck,
  MapPin, UserCircle, Star, ExternalLink, Trash, Save
} from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: (data: Partial<Employee>) => void;
  onEditEmployee: (id: string, data: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
  onViewProfile: (employee: Employee) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees, onAddEmployee, onEditEmployee, onDeleteEmployee, onViewProfile
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('lastName_asc');
  const [searchTerm, setSearchTerm] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  // Initial form state with all requested fields
  const initialFormData = {
    firstName: '',
    lastNamePaternal: '',
    lastNameMaternal: '',
    rut: '',
    email: '',
    emailPersonal: '',
    position: '',
    department: '',
    hireDate: new Date().toISOString().split('T')[0],
    jefaturaNombre: '',
    jefaturaEmail: '',
    emergencyContact: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenModal = () => {
    setIsEditing(false);
    setCurrentEmployeeId(null);
    setFormData(initialFormData);
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleEditClick = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setIsEditing(true);
    setCurrentEmployeeId(employee.id);
    setFormData({
      firstName: employee.firstName,
      lastNamePaternal: employee.lastNamePaternal,
      lastNameMaternal: employee.lastNameMaternal,
      rut: employee.rut,
      email: employee.email,
      emailPersonal: employee.emailPersonal,
      position: employee.position,
      department: employee.department,
      hireDate: employee.hireDate,
      jefaturaNombre: employee.jefaturaNombre,
      jefaturaEmail: employee.jefaturaEmail,
      emergencyContact: employee.emergencyContact
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenu(null);
    onDeleteEmployee(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.firstName && formData.lastNamePaternal) {
      if (isEditing && currentEmployeeId) {
        onEditEmployee(currentEmployeeId, formData);
      } else {
        onAddEmployee(formData);
      }
      setShowModal(false);
      setFormData(initialFormData);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastNamePaternal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastNameMaternal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    switch (sortOption) {
      case 'lastName_asc':
        return a.lastNamePaternal.localeCompare(b.lastNamePaternal);
      case 'lastName_desc':
        return b.lastNamePaternal.localeCompare(a.lastNamePaternal);
      case 'firstName_asc':
        return a.firstName.localeCompare(b.firstName);
      case 'department_asc':
        return a.department.localeCompare(b.department);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-[0px_20px_50px_rgba(26,43,86,0.05)] overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-gradient-to-r from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-900/50">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#2F4DAA] to-[#1A2B56] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <ShieldCheck size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Gestión de Funcionarios</h2>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Directorio Institucional de Talentos</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
            <div className="relative group w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-[#2F4DAA] transition-colors" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, RUT, cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[18px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-medium transition-all"
              />
            </div>

            <button
              onClick={handleOpenModal}
              className="bg-[#F59121] hover:bg-[#E07D10] text-white px-6 py-3.5 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 shadow-lg shadow-orange-500/20 active:scale-95"
            >
              <UserPlus size={18} strokeWidth={2.5} />
              Registrar Nuevo
            </button>
          </div>
        </div>

        {sortedEmployees.length === 0 ? (
          <div className="p-20 text-center bg-slate-50/30 dark:bg-slate-900/10">
            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[40px] shadow-sm flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-800">
              <UserCircle size={48} className="text-slate-200 dark:text-slate-700" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">No se encontraron resultados</h3>
            <p className="text-slate-400 dark:text-slate-500 mt-2 max-w-sm mx-auto font-medium">Refina los criterios de búsqueda o añade un nuevo funcionario al sistema.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
                  <th className="px-8 py-5">Funcionario & Cargo</th>
                  <th className="px-8 py-5">Identificación & Contacto</th>
                  <th className="px-8 py-5">Estructura & Jefatura</th>
                  <th className="px-8 py-5 text-center">Gestión Balances</th>
                  <th className="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {sortedEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-all cursor-pointer"
                    onClick={() => onViewProfile(employee)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={employee.avatarUrl} alt="" className="w-14 h-14 rounded-[22px] object-cover shadow-md group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">
                            {employee.lastNamePaternal} {employee.lastNameMaternal}, {employee.firstName}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Briefcase size={12} className="text-[#2F4DAA]" />
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{employee.position}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-black text-slate-600 dark:text-slate-400 tracking-tighter">
                            RUT: {employee.rut}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                          <Mail size={12} />
                          <span className="text-xs font-semibold truncate max-w-[180px]">{employee.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Building size={12} className="text-[#F59121]" />
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">{employee.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                          <UserCircle size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-tight">Reporta a: {employee.jefaturaNombre || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#2F4DAA] font-black text-xs mb-1">
                            {employee.totalVacationDays - employee.usedVacationDays}
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase">FL</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-[#F59121] font-black text-xs mb-1">
                            {employee.totalAdminDays - employee.usedAdminDays}
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase">PA</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === employee.id ? null : employee.id);
                        }}
                        className="text-slate-400 hover:text-[#2F4DAA] p-3 rounded-[14px] hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:shadow transition-all"
                      >
                        <MoreHorizontal size={20} />
                      </button>

                      {activeMenu === employee.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-12 top-16 w-52 bg-white dark:bg-slate-800 rounded-[20px] shadow-2xl border border-slate-100 dark:border-slate-700 z-50 animate-popup origin-top-right overflow-hidden"
                        >
                          <button
                            onClick={(e) => handleEditClick(e, employee)}
                            className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-[#2F4DAA] transition-colors"
                          >
                            <Edit size={16} className="text-[#2F4DAA]" />
                            Editar Perfil
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, employee.id)}
                            className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-t border-slate-50 dark:border-slate-700/50"
                          >
                            <Trash2 size={16} />
                            Baja de Sistema
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-slate-900/40 backdrop-blur-md animate-fade-in" role="dialog">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-[0px_40px_100px_rgba(0,0,0,0.15)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col scale-100">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[18px] bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-[#F59121]">
                  <UserPlus size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                    {isEditing ? 'Expediente del Funcionario' : 'Alta de Nuevo Funcionario'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5">Sistema unificado de gestión de talento</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-[14px] flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
              {/* Sección 1: Identificación Personal */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <UserCircle size={18} className="text-[#2F4DAA]" />
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identificación Personal</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nombres</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Andrés"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Apellido Paterno</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Tapia"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.lastNamePaternal}
                      onChange={e => setFormData({ ...formData, lastNamePaternal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Apellido Materno</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Muñoz"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.lastNameMaternal}
                      onChange={e => setFormData({ ...formData, lastNameMaternal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">RUT</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 12.345.678-9"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.rut}
                      onChange={e => setFormData({ ...formData, rut: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Personal</label>
                    <input
                      type="email"
                      placeholder="usuario@gmail.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.emailPersonal}
                      onChange={e => setFormData({ ...formData, emailPersonal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Contacto Emergencia</label>
                    <input
                      type="text"
                      placeholder="Nombre y Teléfono"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.emergencyContact}
                      onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Estructura Organizacional */}
              <div className="pt-4">
                <div className="flex items-center gap-3 mb-6">
                  <Building size={18} className="text-[#F59121]" />
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Estructura & Cargo</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Cargo / Función</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Analista de Procesos"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Departamento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Recursos Humanos"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Fecha de Ingreso</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        required
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] pl-12 pr-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                        value={formData.hireDate}
                        onChange={e => setFormData({ ...formData, hireDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Institucional</label>
                    <input
                      type="email"
                      required
                      placeholder="institucional@institucion.cl"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Jefatura Directa</label>
                    <input
                      type="text"
                      placeholder="Nombre de Jefatura"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.jefaturaNombre}
                      onChange={e => setFormData({ ...formData, jefaturaNombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Jefatura</label>
                    <input
                      type="email"
                      placeholder="jefatura@institucion.cl"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[16px] px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-[#2F4DAA] text-sm font-bold transition-all"
                      value={formData.jefaturaEmail}
                      onChange={e => setFormData({ ...formData, jefaturaEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-10 py-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-8 py-3.5 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white dark:hover:bg-slate-800 rounded-[16px] transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-10 py-3.5 bg-gradient-to-br from-[#2F4DAA] to-[#1A2B56] text-white rounded-[18px] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-3"
              >
                <Save size={16} strokeWidth={2.5} />
                {isEditing ? 'Actualizar Expediente' : 'Finalizar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
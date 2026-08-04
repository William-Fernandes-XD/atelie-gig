import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { PAGE_SIZE } from '../../constants/pagination'
import { useAuthStore } from '../../store/authStore'
import { pageContent, pageMeta } from '../../utils/page'

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  ESTOQUISTA: 'Estoquista',
  CLIENTE: 'Cliente',
}

const ROLES = ['ADMIN', 'GERENTE', 'ESTOQUISTA', 'CLIENTE']

function UserPhoto({ user, size = 'md' }) {
  const baseUrl = import.meta.env.VITE_API_URL || ''
  const sizeClass = size === 'lg' ? 'h-24 w-24' : 'h-10 w-10'
  const photoUrl = user?.profilePhotoUrl ? `${baseUrl}${user.profilePhotoUrl}` : null

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-brand-pink/40`}
      />
    )
  }

  return (
    <span
      className={`${sizeClass} flex items-center justify-center rounded-full bg-brand-pink/30 font-display text-lg font-semibold text-brand-purple ring-2 ring-brand-pink/40 dark:text-brand-pink dark:ring-neon-line/20`}
    >
      {user?.name?.charAt(0)?.toUpperCase() || '?'}
    </span>
  )
}

function UserDetailModal({ userId, onClose }) {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [selectedRole, setSelectedRole] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => (await api.get(`/api/users/${userId}`)).data,
    enabled: !!userId,
  })

  const roleMutation = useMutation({
    mutationFn: async (role) => (await api.patch(`/api/users/${userId}/role`, null, { params: { role } })).data,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
      setSelectedRole(updated.role)
      setSaveMessage('Papel atualizado com sucesso.')
    },
    onError: (err) => {
      setSaveMessage(err.response?.data?.message || 'Erro ao atualizar papel.')
    },
  })

  if (!userId) return null

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal max-w-lg">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-neon-text">Detalhes do usuário</h2>
          <button type="button" onClick={onClose} className="text-neon-muted hover:text-neon-text">
            ✕
          </button>
        </div>

        {isLoading ? (
          <p className="mt-6">Carregando...</p>
        ) : error ? (
          <p className="mt-6 text-red-500">Erro ao carregar usuário.</p>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-4">
              <UserPhoto user={user} size="lg" />
              <div>
                <p className="font-display text-xl font-semibold text-neon-text">{user.name}</p>
                <p className="text-sm text-neon-muted">{user.email}</p>
                <p className="mt-1 text-sm">
                  Status:{' '}
                  <span className={user.active ? 'text-green-600' : 'text-red-500'}>
                    {user.active ? 'Ativo' : 'Inativo'}
                  </span>
                </p>
              </div>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-brand-muted">Telefone</dt>
                <dd className="font-medium">{user.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-brand-muted">CPF</dt>
                <dd className="font-medium">{user.cpf || '—'}</dd>
              </div>
              <div>
                <dt className="text-brand-muted">Papel atual</dt>
                <dd className="font-medium">{ROLE_LABELS[user.role] || user.role}</dd>
              </div>
              <div>
                <dt className="text-brand-muted">Cadastro</dt>
                <dd className="font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'}
                </dd>
              </div>
            </dl>

            <div className="rounded-xl border border-brand-pink/30 bg-brand-pink/10 p-4 dark:border-neon-line/10 dark:bg-white/[0.04]">
              <label className="block text-sm font-medium text-neon-text">Alterar papel</label>
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  value={selectedRole ?? user.role}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="admin-input flex-1"
                  disabled={userId === currentUserId}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={roleMutation.isPending || userId === currentUserId || (selectedRole ?? user.role) === user.role}
                  onClick={() => roleMutation.mutate(selectedRole ?? user.role)}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
              {userId === currentUserId && (
                <p className="mt-2 text-xs text-brand-muted">Você não pode alterar o próprio papel.</p>
              )}
              {saveMessage && <p className="mt-2 text-xs text-brand-purple">{saveMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const userRole = useAuthStore((s) => s.user?.role)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: async () =>
      (await api.get(`/api/users?size=${PAGE_SIZE}&page=${page}&sort=createdAt,desc`)).data,
    enabled: userRole === 'ADMIN',
  })

  const users = pageContent(data)
  const meta = pageMeta(data)

  if (userRole !== 'ADMIN') {
    return <p className="text-brand-muted">Acesso restrito ao administrador.</p>
  }

  return (
    <div>
      <h1 className="admin-page-title">Usuários</h1>
      <p className="admin-page-sub">Visualize dados, foto e altere o papel de cada usuário.</p>

      {isLoading ? (
        <p className="mt-6 text-neon-muted">Carregando...</p>
      ) : error ? (
        <p className="mt-6 admin-alert-err">Erro ao carregar usuários.</p>
      ) : users.length === 0 ? (
        <p className="mt-8 admin-table-empty">Nenhum usuário encontrado.</p>
      ) : (
        <>
          <div className="admin-table-wrap mt-8">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <UserPhoto user={u} />
                    </td>
                    <td className="font-medium text-neon-text">{u.name}</td>
                    <td className="text-neon-muted">{u.email}</td>
                    <td>
                      <span className="admin-badge">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td>
                      <span className={u.active ? 'admin-badge' : 'admin-badge-muted'}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(u.id)}
                        className="admin-btn-soft"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalElements={meta.totalElements}
            size={meta.size}
            onPageChange={setPage}
          />
        </>
      )}

      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  )
}

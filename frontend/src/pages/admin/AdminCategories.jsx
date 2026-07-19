import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import api from '../../api/client'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { extractApiError } from '../../components/admin/productFormUtils'
import { PAGE_SIZE } from '../../constants/pagination'
import { pageContent, pageMeta } from '../../utils/page'

const DEFAULT_SLUG = 'sem-categoria'

export default function AdminCategories() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { name: '', description: '', sizeOptions: '40-48' },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page],
    queryFn: async () =>
      (await api.get(`/api/categories?size=${PAGE_SIZE}&page=${page}&sort=name,asc`)).data,
  })

  const categories = pageContent(data)
  const meta = pageMeta(data)
  const visibleCategories = categories.filter((c) => c.slug !== DEFAULT_SLUG)

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const payload = {
        name: formData.name,
        description: formData.description,
        sizeOptions: String(formData.sizeOptions || '40-48')
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean),
      }
      if (editing) {
        return (await api.put(`/api/categories/${editing.id}`, payload)).data
      }
      return (await api.post('/api/categories', payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setMessage(editing ? 'Categoria atualizada!' : 'Categoria cadastrada!')
      setError('')
      setEditing(null)
      reset({ name: '', description: '', sizeOptions: '40-48' })
    },
    onError: (err) => {
      setError(extractApiError(err))
      setMessage('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setMessage('Categoria removida.')
      setError('')
    },
    onError: (err) => {
      setError(extractApiError(err))
    },
  })

  const startEdit = (cat) => {
    setEditing(cat)
    setMessage('')
    setError('')
    reset({
      name: cat.name,
      description: cat.description || '',
      sizeOptions: (cat.sizeOptions || ['40-48']).join(', '),
    })
  }

  const cancelForm = () => {
    setEditing(null)
    reset({ name: '', description: '', sizeOptions: '40-48' })
    setError('')
  }

  const onSubmit = (formData) => saveMutation.mutate(formData)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-brand-charcoal">Categorias</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Cadastre categorias e os tamanhos disponíveis nelas (ex.: 40-48).
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-brand-pink/40 bg-white p-6 shadow-sm ring-1 ring-brand-pink/20"
      >
        <h2 className="font-serif text-xl font-semibold text-brand-charcoal">
          {editing ? 'Editar categoria' : 'Nova categoria'}
        </h2>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label-field">Nome *</label>
            <input
              {...register('name', { required: true })}
              placeholder="Ex.: Vestidos longos"
              className="admin-input"
            />
          </div>
          <div>
            <label className="label-field">Descrição</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Breve descrição da categoria (opcional)"
              className="admin-input rounded-xl"
            />
          </div>
          <div>
            <label className="label-field">Tamanhos da categoria *</label>
            <input
              {...register('sizeOptions', { required: true })}
              placeholder="40-48 (separe por vírgula para mais opções)"
              className="admin-input"
            />
            <p className="mt-1 text-xs text-brand-muted">
              Por enquanto use <strong>40-48</strong>. Esses valores aparecem no filtro da loja e no cadastro de produtos.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {editing ? 'Salvar alterações' : 'Cadastrar categoria'}
          </button>
          {editing && (
            <button type="button" onClick={cancelForm} className="btn-outline">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold text-brand-charcoal">Categorias cadastradas</h2>

        {isLoading ? (
          <p className="mt-4 text-brand-muted">Carregando...</p>
        ) : visibleCategories.length === 0 ? (
          <p className="mt-4 admin-table-empty">Nenhuma categoria cadastrada ainda.</p>
        ) : (
          <>
            <div className="admin-table-wrap mt-4">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Descrição</th>
                    <th>Tamanhos</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCategories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="font-semibold text-brand-charcoal">{cat.name}</td>
                      <td className="text-brand-muted">{cat.description || 'Sem descrição'}</td>
                      <td>
                        <span className="inline-flex rounded-full bg-brand-pink/40 px-2.5 py-1 text-xs font-medium text-brand-purple">
                          {(cat.sizeOptions || ['40-48']).join(', ')}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="rounded-full bg-brand-pink/30 px-3 py-1 text-xs font-medium hover:bg-brand-pink/50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Remover a categoria "${cat.name}"?`)) {
                                deleteMutation.mutate(cat.id)
                              }
                            }}
                            className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Excluir
                          </button>
                        </div>
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
      </section>
    </div>
  )
}

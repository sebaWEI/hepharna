import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LocaleProvider } from '../src/context/LocaleContext'
import { DesignPage } from '../src/pages/Design'
import { DesignsPage } from '../src/pages/Designs'
import { ReferencePage } from '../src/pages/Reference'
import { DesignDetailPage } from '../src/pages/DesignDetail'
import { DesignFoldPreview } from '../src/components/DesignFoldPreview'
import { LeaderboardList } from '../src/components/LeaderboardList'
import { api } from '../src/services/api'

vi.mock('../src/services/api', () => ({ api: {
  config: vi.fn(), referenceFold: vi.fn(), currentDesign: vi.fn(), getDesign: vi.fn(),
  saveDraft: vi.fn(), updateDraft: vi.fn(), submit: vi.fn(), fold: vi.fn(),
  myDesigns: vi.fn(), designFold: vi.fn(),
} }))

const sequence = 'AUGCCAGUCCAGUACGAUCG'
const original = {
  id: 7, design_id: 'HEPHA-D0001-V01', name: '茎环一号', version: 1, sequence,
  status: 'published', length: sequence.length, gc_content: 55, score: 0.85,
  scores: { plddt: 0.9, iptm: 0.8, overall_score: 0.85 }, rank: 1,
  has_structure: false, structure_filename: null, submitted_at: '2026-09-11T08:00:00Z',
  created_at: '2026-09-11T07:00:00Z', updated_at: '2026-09-11T08:00:00Z', published_at: null,
} as const
const copied = { ...original, id: 9, version: 3, status: 'draft', score: null, name: '茎环二号' } as const
const folded = {
  sequence, structure: '.'.repeat(sequence.length), mfe: -2.5, length: sequence.length,
  gc_content: 55, length_delta: null, substitutions: null, changed_positions: null,
  residues: Array.from(sequence, (base, index) => ({ index, base, x: index * 20, y: 10, paired_to: null })),
}

function page(path: string, locale = 'zh') {
  localStorage.setItem('hepha-locale', locale)
  return render(<LocaleProvider><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/design" element={<DesignPage />} />
    <Route path="/reference" element={<ReferencePage />} />
    <Route path="/designs" element={<DesignsPage />} />
    <Route path="/designs/:id" element={<DesignDetailPage />} />
    <Route path="/challenge" element={<p>Submitted destination</p>} />
  </Routes></MemoryRouter></LocaleProvider>)
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  vi.mocked(api.config).mockResolvedValue({
    min_rna_length: 10, max_rna_length: 200, max_submissions_per_user: 5,
    challenge_start_time: null, challenge_end_time: null, challenge_open: true,
    minecraft_server_address: '', minecraft_info: '', reference_rna_sequence: 'G'.repeat(30), reference_rna_name: 'HEPHA',
  })
  vi.mocked(api.referenceFold).mockResolvedValue(folded)
  vi.mocked(api.getDesign).mockImplementation(async (id) => id === 9 ? copied : original)
  vi.mocked(api.saveDraft).mockResolvedValue(copied)
  vi.mocked(api.updateDraft).mockResolvedValue(copied)
  vi.mocked(api.currentDesign).mockResolvedValue({ draft: null, design: original })
  vi.mocked(api.submit).mockResolvedValue({ message: 'ok', design: { ...copied, status: 'submitted' } })
  vi.mocked(api.designFold).mockResolvedValue(folded)
})
afterEach(cleanup)

describe('design history workflow', () => {
  it('loads the selected historical sequence and submits a separately named draft', async () => {
    page('/design?from=7')
    const name = await screen.findByLabelText('设计名称')
    expect((name as HTMLInputElement).value).toBe('茎环一号')
    expect((screen.getByLabelText('第 1 到 5 位碱基') as HTMLInputElement).value).toBe(sequence.slice(0, 5))
    expect(api.currentDesign).not.toHaveBeenCalled()
    fireEvent.change(name, { target: { value: '茎环二号' } })
    fireEvent.click(screen.getByRole('button', { name: '提交设计' }))
    await screen.findByText('Submitted destination')
    expect(api.saveDraft).toHaveBeenCalledExactlyOnceWith(sequence, '茎环二号', true)
    expect(api.updateDraft).not.toHaveBeenCalled()
    expect(api.submit).toHaveBeenCalledWith(9)
  })

  it('continues editing the newly saved draft instead of creating another copy', async () => {
    page('/design?from=7')
    fireEvent.change(await screen.findByLabelText('设计名称'), { target: { value: '茎环二号' } })
    fireEvent.click(screen.getByRole('button', { name: '保存草稿' }))
    await waitFor(() => expect(api.getDesign).toHaveBeenCalledWith(9))
    await screen.findByLabelText('设计名称')
    fireEvent.click(screen.getByRole('button', { name: '提交设计' }))
    await screen.findByText('Submitted destination')
    expect(api.saveDraft).toHaveBeenCalledTimes(1)
    expect(api.updateDraft).toHaveBeenCalledWith(9, sequence, '茎环二号')
  })

  it('retries a failed submission against the saved draft without creating duplicates', async () => {
    vi.mocked(api.submit).mockRejectedValueOnce(new Error('temporary submission error'))
    page('/design?from=7')
    await screen.findByLabelText('设计名称')
    fireEvent.click(screen.getByRole('button', { name: '提交设计' }))
    await screen.findByText('temporary submission error')
    fireEvent.click(screen.getByRole('button', { name: '提交设计' }))
    await screen.findByText('Submitted destination')
    expect(api.saveDraft).toHaveBeenCalledTimes(1)
    expect(api.updateDraft).toHaveBeenCalledWith(9, sequence, '茎环一号')
  })

  it('shows an inaccessible source error without an editable fallback sequence', async () => {
    vi.mocked(api.getDesign).mockRejectedValue(new Error('Design not found.'))
    page('/design?from=999')
    await screen.findByRole('alert')
    expect(screen.queryByLabelText('设计名称')).toBeNull()
    expect(api.currentDesign).not.toHaveBeenCalled()
    expect(api.saveDraft).not.toHaveBeenCalled()
  })

  it('shows history names and routes both buttons to that specific version', async () => {
    vi.mocked(api.myDesigns).mockResolvedValue([original, { ...copied, name: null }])
    page('/designs')
    await screen.findByRole('link', { name: '茎环一号' })
    expect(screen.getAllByRole('link', { name: '预览' })[0].getAttribute('href')).toBe('/designs/7?preview=1')
    expect(screen.getAllByRole('link', { name: '从此处开始设计' })[0].getAttribute('href')).toBe('/design?from=7')
    expect(screen.getByRole('link', { name: '继续编辑草稿' }).getAttribute('href')).toBe('/design?draft=9')
    fireEvent.click(screen.getAllByRole('link', { name: '预览' })[0])
    await screen.findByRole('heading', { name: '二级结构预览' })
    await waitFor(() => expect(api.designFold).toHaveBeenCalledWith(7))
    await screen.findByText('-2.50 kcal/mol')
    expect(api.fold).not.toHaveBeenCalled()
  })

  it('retries a failed historical preview', async () => {
    vi.mocked(api.designFold).mockRejectedValueOnce(new Error('Could not fold this sequence. Please try again.'))
    localStorage.setItem('hepha-locale', 'zh')
    render(<LocaleProvider><DesignFoldPreview designId={7} autoLoad /></LocaleProvider>)
    fireEvent.click(await screen.findByRole('button', { name: '重试' }))
    await screen.findByText('-2.50 kcal/mol')
    expect(api.designFold).toHaveBeenCalledTimes(2)
    expect(document.querySelector('svg')).not.toBeNull()
  })

  it('supports English labels and displays the winning design name with its author', async () => {
    const view = page('/design?from=7', 'en')
    expect((await screen.findByLabelText('Design name') as HTMLInputElement).value).toBe('茎环一号')
    view.unmount()
    render(<LocaleProvider><LeaderboardList entries={[{
      rank: 1, username: 'Alice', participant_id: 'P001', score: 0.85, plddt: 0.9, iptm: 0.8,
      design_id: original.design_id, name: original.name, published_at: null,
    }]} /></LocaleProvider>)
    expect(screen.getByText('茎环一号')).toBeTruthy()
    expect(screen.getByText('Alice')).toBeTruthy()
  })
})


describe('original and previous design references', () => {
  it('keeps the exact old drawing, name, sequence and scores while the new design changes', async () => {
    const detail = page('/designs/7?preview=1')
    await screen.findByText('-2.50 kcal/mol')
    const oldDrawing = screen.getByRole('img', { name: 'RNA 二级结构' }).outerHTML
    detail.unmount()

    const reference = { ...folded, mfe: -17.8 }
    vi.mocked(api.referenceFold).mockResolvedValue(reference)
    page('/design?from=7')
    const input = await screen.findByLabelText('设计名称')
    expect(input.getAttribute('placeholder')).toBe('例如：地表最强RNA')
    expect(screen.queryByText(/名称会显示在/)).toBeNull()
    const initial = screen.getByRole('region', { name: '初始 HEPHA 参考' })
    const previous = screen.getByRole('region', { name: '上一版设计：茎环一号' })
    await within(previous).findByText('-2.50 kcal/mol')
    expect(within(initial).getByText('-17.80 kcal/mol')).toBeTruthy()
    expect(within(previous).getByRole('img').outerHTML).toBe(oldDrawing)
    expect(within(previous).getByText('0.8500')).toBeTruthy()
    expect(within(previous).getByText('0.9000')).toBeTruthy()
    expect(within(previous).getByText('0.8000')).toBeTruthy()
    expect(within(previous).getByText('55.0%')).toBeTruthy()
    expect(within(previous).getByText('20 nt')).toBeTruthy()
    expect(within(previous).getByText(folded.structure)).toBeTruthy()
    const oldInfo = previous.innerHTML
    fireEvent.change(input, { target: { value: '地表最强RNA' } })
    fireEvent.change(screen.getByLabelText('第 1 到 5 位碱基'), { target: { value: 'UUUUU' } })
    expect(previous.innerHTML).toBe(oldInfo)
    expect(screen.getByRole('link', { name: '查看 HEPHA 结构' }).getAttribute('href')).toBe('/reference?from=7')
  })

  it('retains the original reference after saving and after opening the saved draft URL', async () => {
    const editor = page('/design?from=7')
    fireEvent.change(await screen.findByLabelText('设计名称'), { target: { value: '茎环二号' } })
    fireEvent.click(screen.getByRole('button', { name: '保存草稿' }))
    await waitFor(() => expect(api.getDesign).toHaveBeenCalledWith(9))
    await screen.findByLabelText('设计名称')
    expect(screen.getByRole('region', { name: '上一版设计：茎环一号' })).toBeTruthy()
    editor.unmount()
    page('/design?draft=9&from=7')
    expect((await screen.findByLabelText('设计名称') as HTMLInputElement).value).toBe('茎环二号')
    expect(screen.getByRole('heading', { name: '茎环一号' })).toBeTruthy()
    expect(screen.getByRole('region', { name: '初始 HEPHA 参考' })).toBeTruthy()
    expect(api.saveDraft).toHaveBeenCalledTimes(1)
  })

  it('shows identical named historical information on the dedicated reference page', async () => {
    page('/reference?from=7')
    const previous = await screen.findByRole('region', { name: '上一版设计：茎环一号' })
    await within(previous).findByText('-2.50 kcal/mol')
    expect(within(previous).getByText('0.8500')).toBeTruthy()
    expect(within(previous).getByRole('heading', { name: '茎环一号' })).toBeTruthy()
    expect(screen.getByRole('region', { name: '初始 HEPHA 参考' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '从此处开始设计' }).getAttribute('href')).toBe('/design?from=7')
  })
})

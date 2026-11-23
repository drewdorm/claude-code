import { useEffect, useRef, useState } from 'react'
import { Page, Card, Section, Field, Input, Button } from '../components/ui'
import { setSetting, useSetting } from '../data/repo'
import { createBackupFile, readBackupFile, restoreBackup, storageStatus, type BackupSummary } from '../data/backup'
import { formatDate } from '../lib/util'

function FrostField({ label, settingKey }: { label: string; settingKey: string }) {
  const value = useSetting(settingKey)
  const year = new Date().getFullYear()
  return (
    <Field label={label} hint="Only the month and day are used, every year.">
      <Input
        type="date"
        value={value ? `${year}-${value}` : ''}
        onChange={(e) => e.target.value && setSetting(settingKey, e.target.value.slice(5))}
      />
    </Field>
  )
}

export default function Settings() {
  const zone = useSetting('zone')
  const lastBackupAt = useSetting('lastBackupAt')
  const [storage, setStorage] = useState<Awaited<ReturnType<typeof storageStatus>>>()

  useEffect(() => {
    storageStatus().then(setStorage)
    if (location.hash.includes('backup')) document.getElementById('backup')?.scrollIntoView()
  }, [])

  return (
    <Page title="Settings" back>
      <Section title="Growing season">
        <Card className="space-y-4">
          <FrostField label="Average last spring frost" settingKey="lastFrost" />
          <FrostField label="Average first fall frost" settingKey="firstFrost" />
          <Field label="USDA zone">
            <Input value={zone ?? ''} onChange={(e) => setSetting('zone', e.target.value)} />
          </Field>
        </Card>
      </Section>

      <div id="backup" />
      <BackupSection lastBackupAt={lastBackupAt} onChange={() => storageStatus().then(setStorage)} />

      <Section title="Storage on this phone">
        <Card className="space-y-1 text-sm">
          {storage ? (
            <>
              <p>
                {storage.persisted === true && '✅ Your phone has agreed to keep this app’s data.'}
                {storage.persisted === false && '⚠️ Your phone may clear this data if space runs low. Add the app to your Home Screen and back up often.'}
                {storage.persisted === null && 'Your browser didn’t say whether it will keep this data. Back up often.'}
              </p>
              {storage.usedMB !== null && (
                <p className="text-stone-500">
                  Using {storage.usedMB.toFixed(1)} MB{storage.quotaMB ? ` of about ${Math.round(storage.quotaMB).toLocaleString()} MB available` : ''}.
                </p>
              )}
            </>
          ) : (
            <p className="text-stone-500">Checking…</p>
          )}
        </Card>
      </Section>

      <p className="px-1 text-center text-xs text-stone-400">Garden · test version (data stays on this phone)</p>
    </Page>
  )
}

function BackupSection({ lastBackupAt, onChange }: { lastBackupAt?: string; onChange: () => void }) {
  const [file, setFile] = useState<File>()
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState<{ data: Parameters<typeof restoreBackup>[0]; summary: BackupSummary }>()
  const restoreInput = useRef<HTMLInputElement>(null)

  async function make() {
    setBusy('Preparing backup…')
    setMessage('')
    try {
      setFile(await createBackupFile())
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Backup failed.')
    }
    setBusy('')
  }

  async function saveFile(f: File) {
    // iPhone: the share sheet offers "Save to Files", iCloud Drive, Mail, etc.
    if (navigator.canShare?.({ files: [f] })) {
      try {
        await navigator.share({ files: [f], title: f.name })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        throw e
      }
    } else {
      const url = URL.createObjectURL(f)
      const a = document.createElement('a')
      a.href = url
      a.download = f.name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    }
    await setSetting('lastBackupAt', String(Date.now()))
    setMessage('Backup saved.')
    setFile(undefined)
  }

  async function pickRestore(f?: File) {
    if (!f) return
    setMessage('')
    try {
      setPending(await readBackupFile(f))
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }

  async function confirmRestore() {
    if (!pending) return
    setBusy('Restoring…')
    try {
      await restoreBackup(pending.data)
      setMessage('Restored. Everything now matches the backup.')
      onChange()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Restore failed.')
    }
    setPending(undefined)
    setBusy('')
  }

  return (
    <Section title="Backup">
      <Card className="space-y-3">
        <p className="text-sm text-stone-600">
          Your garden is stored only on this phone. Save a backup file to iCloud Drive or Files every week or so.
          {lastBackupAt ? ` Last backup: ${formatDate(Number(lastBackupAt))}.` : ' No backup yet.'}
        </p>
        {file ? (
          <div className="space-y-2">
            <p className="text-sm">
              Ready: <strong>{file.name}</strong> ({(file.size / 1_048_576).toFixed(1)} MB)
            </p>
            <Button className="w-full" onClick={() => saveFile(file).catch((e) => setMessage(String(e)))}>
              Save backup file…
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={make} disabled={!!busy}>
            {busy || 'Create backup'}
          </Button>
        )}

        <input ref={restoreInput} type="file" accept="application/json,.json" className="hidden" onChange={(e) => (pickRestore(e.target.files?.[0]), (e.target.value = ''))} />
        {pending ? (
          <div className="space-y-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              Backup from <strong>{formatDate(Date.parse(pending.summary.exportedAt))}</strong>: {pending.summary.beds} beds, {pending.summary.plantings} plantings,{' '}
              {pending.summary.photos} photos.
            </p>
            <p className="font-medium">Restoring replaces everything currently in the app.</p>
            <div className="flex gap-2">
              <Button variant="danger" className="flex-1" onClick={confirmRestore} disabled={!!busy}>
                {busy || 'Replace with backup'}
              </Button>
              <Button variant="secondary" onClick={() => setPending(undefined)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" className="w-full" onClick={() => restoreInput.current?.click()}>
            Restore from a backup…
          </Button>
        )}
        {message && <p className="text-sm font-medium text-leaf-800">{message}</p>}
      </Card>
    </Section>
  )
}

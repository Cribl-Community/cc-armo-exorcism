import { useState } from 'react';
import { Alert, Button, Drawer, Modal, Switch, Text } from '@capra/core';
import { useRitual } from '../../state/ritual';

export function SettingsDrawer() {
  const { state, actions } = useRitual();
  const [confirmBurn, setConfirmBurn] = useState(false);
  const [burnResult, setBurnResult] = useState<'ok' | 'failed' | null>(null);
  const groups = state.group?.value.ids ?? [];
  const book = state.book?.value;

  return (
    <>
      <Drawer
        isOpen={state.settingsOpen}
        onClose={() => actions.patch({ settingsOpen: false })}
        width={460}
        title={<Drawer.Heading>⚙ Settings</Drawer.Heading>}
      >
        <div className="r-settings">
          <section className="r-settings__section">
            <label className="r-settings__row">
              <Switch aria-label="Perform from memory" checked={state.demo} onChange={(e) => actions.setDemo(e.target.checked)} />
              <span>
                <Text variant="body-md-semibold">Perform from memory</Text>
                <Text as="p" variant="body-sm-normal" color="subtle">Run the full rite with simulated data. No Cribl calls are made.</Text>
              </span>
            </label>
            <label className="r-settings__row">
              <Switch aria-label="Autoplay" checked={state.autoplay} onChange={(e) => actions.patch({ autoplay: e.target.checked })} />
              <span>
                <Text variant="body-md-semibold">Autoplay (presenter mode)</Text>
                <Text as="p" variant="body-sm-normal" color="subtle">Presses each screen’s main button after a few seconds. Hotkey: A.</Text>
              </span>
            </label>
          </section>

          {groups.length > 1 && (
            <section className="r-settings__section">
              <Text variant="body-md-semibold">Worker Group to possess</Text>
              <select
                className="r-settings__select"
                value={state.group?.value.chosen}
                onChange={(e) => actions.chooseGroup(e.target.value)}
                disabled={state.demo}
              >
                {groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </section>
          )}

          <section className="r-settings__section">
            <Text variant="body-md-semibold">The Book of Offerings</Text>
            <Text as="p" variant="body-sm-normal" color="subtle">
              Anonymous counters shared by everyone who performs the rite here (app KV key <code>church/book</code>).
              {book && ` ${book.believers} believer(s) so far.`}
            </Text>
            <div>
              <Button appearance="danger" variant="secondary" onClick={() => { setBurnResult(null); setConfirmBurn(true); }}>Burn the Book…</Button>
            </div>
            {burnResult === 'ok' && <Alert appearance="success" layout="inline">The Book of Offerings was burned.</Alert>}
            {burnResult === 'failed' && <Alert appearance="danger" layout="inline">The Book resisted. It could not be deleted.</Alert>}
          </section>

          <section className="r-settings__section">
            <Alert appearance="info" title="What the Church never does">
              The app cannot create, change or delete any Cribl configuration. The exorcism runs in pipeline
              preview; nothing is saved. Every call is listed in the Scripture.
            </Alert>
          </section>
        </div>
      </Drawer>

      <Modal
        isOpen={confirmBurn}
        onIsOpenChange={setConfirmBurn}
        title="Burn the Book of Offerings?"
        confirmButtonText="Burn it"
        cancelButtonText="Keep it"
        onClose={() => setConfirmBurn(false)}
        onConfirm={async () => {
          const ok = await actions.burnBook();
          setBurnResult(ok ? 'ok' : 'failed');
        }}
      >
        <Text as="p">
          This deletes the key <code>church/book</code> from this app’s own KV store, resetting the believer
          count and sacrifice statistics for everyone. It does not touch Cribl configuration. <strong>This cannot be undone.</strong>
        </Text>
      </Modal>
    </>
  );
}

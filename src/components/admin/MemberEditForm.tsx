import { useEffect, useState } from 'react';
import type { FamilyMember, MemberColor, NewMember } from '../../domain/models';
import { getMemberDisplayName } from '../../utils/member';
import { Card } from '../Card';
import { Field } from './Field';
import { MemberSelect } from './MemberSelect';

const COLORS: Array<{ value: MemberColor; label: string }> = [
  { value: 'teal', label: 'Turquoise' },
  { value: 'blue', label: 'Bleu' },
  { value: 'violet', label: 'Violet' },
  { value: 'amber', label: 'Ambre' },
  { value: 'coral', label: 'Corail' },
  { value: 'green', label: 'Vert' },
];

interface MemberEditFormProps {
  /** Membres triés par ordre alphabétique. */
  members: FamilyMember[];
  onSave: (id: string, input: NewMember) => Promise<void>;
}

/**
 * Corrige l'identité d'un membre : titre, prénom, nom, couleur.
 * L'identifiant ne change pas, donc aucun de ses versements n'est détaché.
 */
export function MemberEditForm({ members, onSave }: MemberEditFormProps) {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [color, setColor] = useState<MemberColor>('teal');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = members.find((member) => member.id === id);

  useEffect(() => {
    if (!selected) return;

    setTitle(selected.title ?? '');
    setFirstName(selected.firstName);
    setLastName(selected.lastName ?? '');
    setColor(selected.color);
    setFeedback('');
  }, [selected]);

  const valid = Boolean(selected) && firstName.trim().length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !selected || saving) return;

    setSaving(true);
    try {
      // `undefined` explicite plutôt qu'omission : vider le titre doit l'effacer.
      await onSave(selected.id, {
        title: title.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        color,
        avatarUrl: selected.avatarUrl ?? null,
      });

      setFeedback('Membre modifié. Ses versements sont inchangés.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="admin-card admin-card--edit">
      <header className="admin-card__head">
        <span className="admin-card__badge admin-card__badge--edit" aria-hidden="true">✎</span>
        <div>
          <h2 className="admin-card__title">Corriger un membre</h2>
          <p className="admin-card__subtitle">
            Changer un nom mal orthographié ou un titre. Les versements du membre
            restent attachés à lui.
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <Field label="Membre à corriger" htmlFor="edit-member-pick">
          <MemberSelect
            id="edit-member-pick"
            members={members}
            value={id}
            onChange={setId}
          />
        </Field>

        {selected && (
          <>
            <div className="form__row form__row--thirds">
              <Field label="Titre" htmlFor="edit-member-title" optional hint="Tonton, Dr, PDG…">
                <input
                  id="edit-member-title"
                  className="input"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </Field>

              <Field label="Prénom" htmlFor="edit-member-first">
                <input
                  id="edit-member-first"
                  className="input"
                  type="text"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    setFeedback('');
                  }}
                  required
                />
              </Field>

              <Field label="Nom" htmlFor="edit-member-last" optional>
                <input
                  id="edit-member-last"
                  className="input"
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </Field>
            </div>

            <Field label="Couleur de l’avatar" htmlFor="edit-member-color-teal">
              <div className="swatches" role="radiogroup" aria-label="Couleur de l’avatar">
                {COLORS.map((item) => (
                  <label
                    key={item.value}
                    className={`swatch swatch--${item.value}${
                      color === item.value ? ' swatch--active' : ''
                    }`}
                    title={item.label}
                  >
                    <input
                      id={`edit-member-color-${item.value}`}
                      type="radio"
                      name="edit-member-color"
                      value={item.value}
                      checked={color === item.value}
                      onChange={() => setColor(item.value)}
                    />
                    <span className="visually-hidden">{item.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="form__actions">
              <button type="submit" className="button button--edit" disabled={!valid || saving}>
                {saving ? 'Enregistrement…' : `Enregistrer — ${getMemberDisplayName(selected)}`}
              </button>
              {feedback && <p className="form__feedback form__feedback--edit">{feedback}</p>}
            </div>
          </>
        )}
      </form>
    </Card>
  );
}

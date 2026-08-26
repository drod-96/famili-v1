import { useState } from 'react';
import type { FamilyMember, MemberColor, NewMember } from '../../domain/models';
import { Card } from '../Card';
import { Field } from './Field';

const COLORS: Array<{ value: MemberColor; label: string }> = [
  { value: 'teal', label: 'Turquoise' },
  { value: 'blue', label: 'Bleu' },
  { value: 'violet', label: 'Violet' },
  { value: 'amber', label: 'Ambre' },
  { value: 'coral', label: 'Corail' },
  { value: 'green', label: 'Vert' },
];

interface MemberFormProps {
  members: FamilyMember[];
  onSubmit: (input: NewMember) => Promise<void>;
}

export function MemberForm({ members, onSubmit }: MemberFormProps) {
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [color, setColor] = useState<MemberColor>(() => leastUsedColor(members));
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = firstName.trim().length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || saving) return;

    setSaving(true);
    try {
      const name = firstName.trim();
      await onSubmit({
        title: title.trim() || undefined,
        firstName: name,
        lastName: lastName.trim() || undefined,
        color,
        avatarUrl: null,
      });

      setFeedback(`${name} a été ajouté à la liste des membres.`);
      setTitle('');
      setFirstName('');
      setLastName('');
      setColor(leastUsedColor([...members, { color } as FamilyMember]));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="admin-card admin-card--member">
      <header className="admin-card__head">
        <span className="admin-card__badge admin-card__badge--member" aria-hidden="true">@</span>
        <div>
          <h2 className="admin-card__title">Nouveau membre</h2>
          <p className="admin-card__subtitle">
            Il apparaît aussitôt dans la liste, classée par ordre alphabétique.
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form__row form__row--thirds">
          <Field label="Titre" htmlFor="member-title" optional hint="Tonton, Dr, PDG, Maire…">
            <input
              id="member-title"
              className="input"
              type="text"
              placeholder="Tonton"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>

          <Field label="Prénom" htmlFor="member-first">
            <input
              id="member-first"
              className="input"
              type="text"
              placeholder="Jean Michel"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                setFeedback('');
              }}
              required
            />
          </Field>

          <Field label="Nom" htmlFor="member-last" optional>
            <input
              id="member-last"
              className="input"
              type="text"
              placeholder="Henri"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </Field>
        </div>

        <Field label="Couleur de l’avatar" htmlFor="member-color-teal">
          <div className="swatches" role="radiogroup" aria-label="Couleur de l’avatar">
            {COLORS.map((item) => (
              <label
                key={item.value}
                className={`swatch swatch--${item.value}${color === item.value ? ' swatch--active' : ''}`}
                title={item.label}
              >
                <input
                  id={`member-color-${item.value}`}
                  type="radio"
                  name="member-color"
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
          <button type="submit" className="button button--member" disabled={!valid || saving}>
            {saving ? 'Ajout…' : 'Ajouter le membre'}
          </button>
          {feedback && <p className="form__feedback form__feedback--member">{feedback}</p>}
        </div>
      </form>
    </Card>
  );
}

/** Évite de donner deux fois la même couleur tant que la palette n'est pas épuisée. */
function leastUsedColor(members: Array<Pick<FamilyMember, 'color'>>): MemberColor {
  const counts = new Map<MemberColor, number>(COLORS.map((item) => [item.value, 0]));
  for (const member of members) {
    counts.set(member.color, (counts.get(member.color) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => a[1] - b[1])[0][0];
}


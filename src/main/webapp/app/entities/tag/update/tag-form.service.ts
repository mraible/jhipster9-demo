import { Service } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ITag, NewTag } from '../tag.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ITag for edit and NewTagFormGroupInput for create.
 */
type TagFormGroupInput = ITag | PartialWithRequiredKeyOf<NewTag>;

type TagFormDefaults = Pick<NewTag, 'id' | 'posts'>;

type TagFormGroupContent = {
  id: FormControl<ITag['id'] | NewTag['id']>;
  name: FormControl<ITag['name']>;
  posts: FormControl<ITag['posts']>;
};

export type TagFormGroup = FormGroup<TagFormGroupContent>;

@Service()
export class TagFormService {
  createTagFormGroup(tag?: TagFormGroupInput): TagFormGroup {
    const tagRawValue = {
      ...this.getFormDefaults(),
      ...(tag ?? { id: null }),
    };

    return new FormGroup<TagFormGroupContent>({
      id: new FormControl(
        { value: tagRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      name: new FormControl(tagRawValue.name, {
        validators: [Validators.required, Validators.minLength(2)],
      }),
      posts: new FormControl(tagRawValue.posts ?? []),
    });
  }

  getTag(form: TagFormGroup): ITag | NewTag {
    return form.getRawValue();
  }

  resetForm(form: TagFormGroup, tag: TagFormGroupInput): void {
    const tagRawValue = { ...this.getFormDefaults(), ...tag };
    form.reset({
      ...tagRawValue,
      id: { value: tagRawValue.id, disabled: true },
    });
  }

  private getFormDefaults(): TagFormDefaults {
    return {
      id: null,
      posts: [],
    };
  }
}

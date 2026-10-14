import { Service } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IBlog, NewBlog } from '../blog.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IBlog for edit and NewBlogFormGroupInput for create.
 */
type BlogFormGroupInput = IBlog | PartialWithRequiredKeyOf<NewBlog>;

type BlogFormDefaults = Pick<NewBlog, 'id'>;

type BlogFormGroupContent = {
  id: FormControl<IBlog['id'] | NewBlog['id']>;
  name: FormControl<IBlog['name']>;
  handle: FormControl<IBlog['handle']>;
  user: FormControl<IBlog['user']>;
};

export type BlogFormGroup = FormGroup<BlogFormGroupContent>;

@Service()
export class BlogFormService {
  createBlogFormGroup(blog?: BlogFormGroupInput): BlogFormGroup {
    const blogRawValue = {
      ...this.getFormDefaults(),
      ...(blog ?? { id: null }),
    };

    return new FormGroup<BlogFormGroupContent>({
      id: new FormControl(
        { value: blogRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      name: new FormControl(blogRawValue.name, {
        validators: [Validators.required, Validators.minLength(3)],
      }),
      handle: new FormControl(blogRawValue.handle, {
        validators: [Validators.required, Validators.minLength(2)],
      }),
      user: new FormControl(blogRawValue.user),
    });
  }

  getBlog(form: BlogFormGroup): IBlog | NewBlog {
    return form.getRawValue();
  }

  resetForm(form: BlogFormGroup, blog: BlogFormGroupInput): void {
    const blogRawValue = { ...this.getFormDefaults(), ...blog };
    form.reset({
      ...blogRawValue,
      id: { value: blogRawValue.id, disabled: true },
    });
  }

  private getFormDefaults(): BlogFormDefaults {
    return {
      id: null,
    };
  }
}

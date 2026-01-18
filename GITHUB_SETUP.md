# Создание репозитория на GitHub

## Шаг 1: Создайте репозиторий на GitHub

1. Перейдите на: **https://github.com/new**

2. Заполните форму:
   - **Repository name**: `gameshop`
   - **Description**: (опционально) "Game shop application built with Nuxt 3"
   - **Visibility**: 
     - ✅ **Public** - если хотите, чтобы код был виден всем
     - ✅ **Private** - если хотите скрыть код
   - **ВАЖНО:** НЕ ставьте галочки на:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license

3. Нажмите **"Create repository"**

## Шаг 2: После создания репозитория

После создания репозитория GitHub покажет страницу с инструкциями. 

**НЕ выполняйте** команды, которые GitHub предлагает (они для нового репозитория).

Вместо этого выполните в терминале:

```bash
git push -u origin main
```

Если репозиторий уже подключен (как у вас), просто выполните push.

## Если возникли проблемы

### Ошибка: "Repository not found"
- Убедитесь, что репозиторий создан на GitHub
- Проверьте правильность URL: `https://github.com/artem74ru/gameshop.git`
- Убедитесь, что вы авторизованы на GitHub

### Ошибка: "Permission denied"
- Проверьте авторизацию: `git config --global user.name` и `git config --global user.email`
- Возможно, нужно использовать SSH вместо HTTPS, или настроить Personal Access Token

### Проверка подключения
```bash
# Проверить текущий remote
git remote -v

# Если нужно изменить URL
git remote set-url origin https://github.com/artem74ru/gameshop.git
```

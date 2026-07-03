# OpenCode / 本地 skills 客户端安装

OpenCode、Trae、Qoder、Trae CN 或其他支持本地 `skills/` 目录的客户端，可以直接加载本仓库的 `skills/`。

## Symlink 安装

```bash
git clone https://github.com/Vincen-dev/coding-plugins.git
mkdir -p your-project/.agents
ln -s /absolute/path/to/coding-plugins/skills your-project/.agents/skills
```

本仓库自身也提供 `.agents/skills -> ../skills` 入口，在仓库根目录打开支持 `.agents/skills` 的客户端时可直接发现技能。如果当前平台不保留 symlink，可按 Copy 安装方式复制 `skills/`。

## Copy 安装

```bash
git clone https://github.com/Vincen-dev/coding-plugins.git
mkdir -p your-project/.agents/skills
cp -R /absolute/path/to/coding-plugins/skills/* your-project/.agents/skills/
```

## 升级

Symlink 安装：

```bash
cd /absolute/path/to/coding-plugins
git pull
```

Copy 安装需要重新复制 `skills/`。

## 验证

确认客户端能发现 `using-coding-plugins`，并从这个入口开始开发任务。

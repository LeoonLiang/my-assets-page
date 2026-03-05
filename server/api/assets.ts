import axios from 'axios'
import matter from 'gray-matter'

export default defineEventHandler(async (event) => {
    const githubRepository = process.env.GITHUB_REPOSITORY;

    if (!githubRepository) {
        console.warn("GITHUB_REPOSITORY env not set, using default for test");
    }

    const [owner, repo] = (githubRepository || 'LeoonLiang/my-assets-page').split('/')
    const ISSUE_TITLE = 'Asset Database'

    try {
        // 1. 获取主 Issue
        const issues = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/issues`,
            {
                params: {
                    state: 'all',
                    per_page: 10,
                }
            }
        )

        const mainIssue = issues.data.find(
            (i: any) => i.title === ISSUE_TITLE
        )

        if (!mainIssue) {
            console.log("No Asset issue found. Returning empty array.");
            return { title: '', author: '', assets: [] };
        }

        // 2. 解析 Issue 正文，提取 title 和 author
        let issueTitle = ''
        let issueAuthor = ''
        let showGithubLink = false
        if (mainIssue.body) {
            try {
                const issueParsed = matter(mainIssue.body)
                issueTitle = issueParsed.data.title || ''
                issueAuthor = issueParsed.data.author || ''
                showGithubLink = issueParsed.data.show_github_link || false
            } catch (e) {
                console.warn('Failed to parse issue body frontmatter', e)
            }
        }

        // 3. 获取评论（资产列表）
        const comments = await axios.get(
            mainIssue.comments_url
        )

        const assets = comments.data.map((c: any) => {
            try {
                const parsed = matter(c.body)
                return {
                    ...parsed.data,
                    content: parsed.content,
                    updated: c.updated_at
                }
            } catch (e) {
                return null;
            }
        }).filter((a: any) => a && a.name)

        return { title: issueTitle, author: issueAuthor, showGithubLink, assets };

    } catch (err: any) {
        if (err.response && err.response.status === 404) {
            console.log("Repository or issues not found (404). Returning empty array.");
            return { title: '', author: '', assets: [] };
        }
        throw err;
    }
})

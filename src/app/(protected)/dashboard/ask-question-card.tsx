'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import useProject from '@/hooks/use-project'
import Image from 'next/image'
import { askQuestion } from './actions'
import { readStreamableValue } from 'ai/rsc'
import MDEditor from '@uiw/react-md-editor'
import CodeReferences from './code-references'
import { api } from '@/trpc/react'
import { on } from 'events'
import { toast } from 'sonner'
import useRefetch from '@/hooks/use-refetch'


const AskQuestionCard = () => {
    const { project } = useProject()
    const [open, setOpen ] = React.useState(false)
    const [ question, setQuestion ] = React.useState('')
    const [loading , setLoading] = React.useState(false)
    const [filesReferences, setFilesReferences] = React.useState<{ fileName: string, sourceCode: string, summary: string }[]>([])
    const [answer , setAnswer] = React.useState('')
    const saveAnswer = api.project.saveAnswer.useMutation()

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setAnswer('')
        setFilesReferences([])
        e.preventDefault()
        if (!project?.id) return 
        setLoading(true)
        
        const { output, filesReferences } = await askQuestion(question, project.id)
        setOpen(true)
        setFilesReferences(filesReferences)

        for await (const delta of readStreamableValue(output)) {
            if (delta) {
                setAnswer(ans => ans + delta)
            }
        }
        setLoading(false)
    }
    const refetch = useRefetch()

    return (
        <>
            <Dialog open = {open} onOpenChange={setOpen}>
                <DialogContent className = 'sm:max-w-[80vw]'>
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <DialogTitle>
                                <Image src='/logo.png' alt='GitRAG' width={40} height={40} />
                            </DialogTitle>
                            <Button  disabled={saveAnswer. isPending} variant={'outline'} onClick={() => {
                                saveAnswer.mutate({
                                    projectId: project!.id,
                                    question,
                                    answer,
                                    filesReferences,
                                }, {
                                    onSuccess: () => {
                                        toast.success('Answer Saved!')
                                        refetch()
                                    }, 
                                    onError: () => {
                                        toast.error('Failed to save answer!')
                                    }
                                })
                            }}>
                            </Button>
                        </div>
                    </DialogHeader>
                    <Button type='button' onClick={() => {setOpen(false)}}>Close</Button>
                    <MDEditor.Markdown source={answer} className= 'max-w-[70vw] !h-full max-h-[40vh] overflow-scroll'/>
                    <div className="h-4"></div>
                    <CodeReferences filesReferences={filesReferences}/>

                    <Button type='button' onClick={() => {setOpen(false)}}>Close</Button>

                </DialogContent>
            </Dialog>
            
            <Card className='relative col-span-3'>
                <CardHeader>
                    <CardTitle>Ask a Question</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit}>
                        <Textarea placeholder='Which file should I edit to change the homepage?' value={question} onChange={e => setQuestion(e.target.value)}/>
                        <div className="h-4"></div>
                        <Button type='submit' disabled={loading}>
                            Ask GitRAG! 
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}

export default AskQuestionCard
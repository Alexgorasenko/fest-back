module.exports = input => {
    const { head, activities, extras, total, signatures, nomination } = input

    const wgroups = head.filter(col => col.groups)
    const { groups } = wgroups[0]
    const re_head = head.reduce((acc, col) => {
        if(!col.groups) {
            acc.push(col)
        } else {
            if(!acc.find(c => c.levels)) {
                acc.push({
                    levels: groups.map(gr => ({
                        width: 100/groups.length,
                        content: gr.content,
                        subcolumns: [
                            {
                                width: 50,
                                content: 'Количество обучающихся'
                            },
                            {
                                width: 50,
                                content: 'Участвовало в мероприятии'
                            }
                        ]
                    })),
                    width: 45
                })
            }
        }

        return acc
    }, [])

    const list = activities.map(item => {
        const itemgroups = item.filter(col => col.groups)

        return item.reduce((acc, col) => {
            if(!col.groups) {
                acc.push(col)
            } else {
                if(!acc.find(c => c.levels)) {
                    acc.push({
                        levels: groups.map((gr, idx) => {
                            return {
                                width: 100/groups.length,
                                subcolumns: [
                                    {
                                        width: 50,
                                        content: itemgroups[0].groups[idx][0].value
                                    },
                                    {
                                        width: 50,
                                        content: itemgroups[1].groups[idx] ? itemgroups[1].groups[idx][0].value : 0
                                    }
                                ]
                            }
                        }),
                        width: 45
                    })
                }
            }

            return acc
        }, [])
    })

    return {...input, head: re_head, activities: list}
}

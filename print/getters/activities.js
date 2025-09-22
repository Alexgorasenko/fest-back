module.exports = async () => {
    try {
        const head = [
            {content: '№', width: 2},
            {content: 'Мероприятие', width: 15},
            {content: 'Дата проведения', width: 9},
            {
                content: 'Количество обучающихся',
                width: 25,
                groups: [
                    {
                        content: '1-4 классы',
                        columns: [
                            {content: 'Всего'},
                            {content: 'Девочки'}
                        ]
                    },
                    {
                        content: '5-8 классы',
                        columns: [
                            {content: 'Всего'},
                            {content: 'Девочки'}
                        ]
                    },
                    {
                        content: '9-11 классы',
                        columns: [
                            {content: 'Всего'},
                            {content: 'Девочки'}
                        ]
                    }
                ]
            },
            {
                content: 'Количество участников мероприятия',
                width: 25,
                groups: [
                    {
                        content: '1-4 классы',
                        columns: [
                            {content: 'Всего'},
                            {content: 'Девочки'}
                        ]
                    },
                    {
                        content: '5-8 классы',
                        columns: [
                            {content: 'Всего'},
                            {content: 'Девочки'}
                        ]
                    },
                    {
                        content: '9-11 классы',
                        columns: [
                            {content: 'Всего'},
                            {content: 'Девочки'}
                        ]
                    }
                ]
            },
            {content: 'Баллы за проведение мероприятия', width: 10},
            {content: 'Доп. баллы', width: 5},
            {content: 'ВСЕГО', width: 9},
        ]

        const activities = [
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
            [
                {width: 2, value: 1},
                {width: 15, value: '«Футбольная карусель»'},
                {width: 9, value: '20.11.2023'},
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {
                    width: 25,
                    groups: [
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ],
                        [
                            {value: '50'},
                            {value: '20'}
                        ]
                    ],
                    groupInnerWidth: "33.3"
                },
                {width: 10, value: 10, cellClass: 'value-cell'},
                {width: 5, value: 3, cellClass: 'value-cell'},
                {width: 9, value: 13, cellClass: 'value-cell'}
            ],
        ]

        const extras = [
            {
                label: 'Итоговый ролик о проведении мероприятия',
                cells: [
                    {value: 0, width: 41.6},
                    {value: 10, width: 20.8},
                    {value: 10, width: 37.5}
                ]
            },
            {
                label: 'Количество проведенных мероприятий',
                cells: [
                    {value: 0, width: 41.6},
                    {value: 10, width: 20.8},
                    {value: 10, width: 37.5}
                ]
            }
        ]

        const total = 78

        const signatures = {
            top: {
                position: 'Директор',
                orgName: 'Муниципальное бюджетное общеобразовательное учреждение "Луковецкая средняя школа имени Я.В. Самоварова"',
                name: 'Рухлова Светлана Дмитриевна'
            },
            bottom: {
                name: 'Зарубина Анна Васильевна'
            }
        }

        return {success: true, data: { head, activities, extras, total, signatures }}
    } catch (e) {
        console.log('activities failed', e);
        return {success: false, message: 'activities failed', errorStatus: 500}
    }
}

// Copyright FORTH-ICS, Emmanouil Dermitzakis

//Color identification for each category
var categoryColor = {
	"Book": '#52c329',
	"Conference_Workshop": '#ff972a',
	"Journal": '#982db3',
	"Other": '#727272',
};


//Fields for each category
var JSONfields = {
	"Conference_Workshop": {
		"Conf_Peer_Reviewed":{
			"Paper_In_Proceedings_Full_Paper_Reviewed": ["hasAuthors", "englishTitle", "conferenceTitle", ["conferenceDateStart", "conferenceDateEnd"], ["conferenceLocation", "year"], "bookTitle","bookSeries", "hasBookEditors", ["volume", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
			"Paper_In_Proceedings_Abstract_Reviewed": ["hasAuthors", "englishTitle", "conferenceTitle", ["conferenceDateStart", "conferenceDateEnd"], ["conferenceLocation", "year"], "bookTitle","bookSeries", "hasBookEditors", ["volume", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
			"Poster_In_Proceedings_Full_Paper_Reviewed": ["hasAuthors", "englishTitle", "conferenceTitle", ["conferenceDateStart", "conferenceDateEnd"], ["conferenceLocation", "year"], "bookTitle","bookSeries", "hasBookEditors", ["volume", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
			"Poster_In_Proceedings_Abstract_Reviewed": ["hasAuthors", "englishTitle", "conferenceTitle", ["conferenceDateStart", "conferenceDateEnd"], ["conferenceLocation", "year"], "bookTitle","bookSeries", "hasBookEditors", ["volume", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
			"Demo": ["hasAuthors", "englishTitle", "conferenceTitle", ["conferenceDateStart", "conferenceDateEnd"], ["conferenceLocation", "year"], "bookTitle","bookSeries", "hasBookEditors", ["volume", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "demoUrl", "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
			"Tutorial": ["hasAuthors", "englishTitle", "conferenceTitle", ["conferenceDateStart", "conferenceDateEnd"], ["conferenceLocation", "year"], "bookTitle","bookSeries", "hasBookEditors", ["volume", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "demoUrl", "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
		},
		"Conf_Non_Peer_Reviewed": {
			"Edited_Proceeding": ["hasBookEditors", "bookTitle","bookSeries", ["publisher", "publisherLocation"],
				["isbn", "doi"],
				["volume", "pages"], "conferenceTitle", ["conferenceDateStart", "conferenceDateEnd"], ["conferenceLocation", "year"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
			"Invited_Paper": ["hasAuthors", "englishTitle", "conferenceTitle", ["conferenceDateStart", "conferenceDateEnd"], ["conferenceLocation", "year"], "bookTitle","bookSeries", "hasBookEditors", ["volume", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			]
		},
	},
	"Book": {
		"Chapter_In_Book": ["hasChapterAuthors", "chapterTitle", "bookTitle","bookSeries", "hasBookEditors", ["year", "edition"],
			["volume", "pages"],
			["publisher", "publisherLocation"],
			["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
		],
		"Editor": ["hasAuthors", "hasBookEditors", "bookTitle","bookSeries", ["year", "pages"],
			["publisher", "publisherLocation"],
			["volume", "edition"],
			["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
		],
		"Whole_Book": ["hasAuthors", "hasBookEditors", "bookTitle","bookSeries", ["year", "pages"],
			["publisher", "publisherLocation"],
			["volume", "edition"],
			["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
		],
		"Monograph": ["hasAuthors", "hasBookEditors", "bookTitle","bookSeries", ["year", "pages"],
			["publisher", "publisherLocation"],
			["volume", "edition"],
			["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
		]
	},
	"Journal": {
		"Journal_Peer_Reviewed": {
			"Journal_Article": ["hasAuthors", "englishTitle", "journalTitle", ["volume", "journalNumber"],
				["year", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
			"Scientific_Newsletter": ["hasAuthors", "englishTitle", "journalTitle", ["volume", "journalNumber"],
				["year", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
		},
		"Journal_Non_Peer_Reviewed": {
			"Foreword": ["hasAuthors", "englishTitle", "journalTitle", ["volume", "journalNumber"],
				["year", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
			"Journal_Editorial": ["hasAuthors", "englishTitle", "journalTitle", ["volume", "journalNumber"],
				["year", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
			"Magazine_Editorial": ["hasAuthors", "englishTitle", "journalTitle", ["volume", "journalNumber"],
				["year", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
			"Other_Journal": ["hasAuthors", "englishTitle", "journalTitle", ["volume", "journalNumber"],
				["year", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			],
		},
		"Magazine":{
			"ERCIM_News": ["hasAuthors", "englishTitle", "journalTitle", ["volume", "journalNumber"],
				["year", "pages"],
				["publisher", "publisherLocation"],
				["isbn", "doi"], "localLink", "project", "externalLink", "englishAbstract", "tag"
			]
		}
	},
	"Other": {
		"FORTH_ICS_Tech_Report": ["hasAuthors", "englishTitle", "year", "reportNumber", "localLink", "project", "englishAbstract", "tag"],
		"Other_Tech_Report": ["hasAuthors", "englishTitle", "year", "doi", "localLink", "project", "externalLink", "englishAbstract", "tag"],
		"Thesis": {
			"Master_Thesis": ["hasAuthors", "greekTitle", "englishTitle", "year", "doi", "greekAbstract", "englishAbstract", "hasSupervisors", "localLink", "project", "externalLink", "tag"],
			"Phd_Thesis": ["hasAuthors", "greekTitle", "englishTitle", "year", "doi", "greekAbstract", "englishAbstract", "hasSupervisors", "localLink", "project", "externalLink", "tag"],
		},
		"Event": {
			"Talk": ["hasAuthors", "englishTitle", "year", "eventTitle", "eventLocation", "otherDetails", "localLink", "project", "externalLink", "englishAbstract", "tag"],
			"Seminar": ["hasAuthors", "englishTitle", "year", "eventTitle", "eventLocation", "otherDetails", "localLink", "project", "externalLink", "englishAbstract", "tag"],
			"Distinguished_Lecture": ["hasAuthors", "englishTitle", "year", "eventTitle", "eventLocation", "localLink", "project", "externalLink", "englishAbstract", "tag"],
		},
		"Multimedia_Material": ["hasAuthors", "englishTitle", "year", "localLink", "project", "externalLink", "englishAbstract", "tag"],
		"White_Paper": ["hasAuthors", "englishTitle", "year", "doi", "localLink", "project", "externalLink", "englishAbstract", "tag"],
		"Miscellaneous": ["hasAuthors", "englishTitle", "year", "location", "doi", "otherDetails", "localLink", "project", "externalLink", "englishAbstract", "tag"]
	}
};

//Required fields of each category
var JSONrequiredFields = {
  "Conference_Workshop": {
		"Conf_Peer_Reviewed": {
	    "Paper_In_Proceedings_Full_Paper_Reviewed": ['hasAuthors', 'englishTitle', 'year', 'localLink'],
	    "Paper_In_Proceedings_Abstract_Reviewed": ['hasAuthors', 'englishTitle', 'year', 'localLink'],
	    "Poster_In_Proceedings_Full_Paper_Reviewed": ['hasAuthors', 'englishTitle', 'year', 'localLink'],
	    "Poster_In_Proceedings_Abstract_Reviewed": ['hasAuthors', 'englishTitle', 'year', 'localLink'],
	    "Demo": ['hasAuthors', 'englishTitle', 'year'],
	    "Tutorial": ['hasAuthors', 'englishTitle', 'year'],
		},
		"Conf_Non_Peer_Reviewed": {
	    "Edited_Proceeding": ['hasBookEditors', 'bookTitle', 'bookSeries', 'year', 'publisher', 'publisherLocation'],
	    "Invited_Paper": ['hasAuthors', 'englishTitle', 'year', 'localLink'],
		},
  },
  "Book": {
    "Chapter_In_Book": ['hasChapterAuthors', 'chapterTitle', 'bookTitle', 'year'],
    "Editor": ['hasAuthors', 'bookTitle', 'year'],
    "Whole_Book": ['hasAuthors', 'bookTitle', 'year'],
    "Monograph": ['hasAuthors', 'bookTitle', 'year']
  },
  "Journal": {
		"Journal_Peer_Reviewed": {
			'Journal_Article': ['hasAuthors', 'englishTitle', 'journalTitle', 'year', 'localLink'],
	    'Scientific_Newsletter': ['hasAuthors', 'englishTitle', 'journalTitle', 'year', 'localLink'],
		},
		"Journal_Non_Peer_Reviewed": {
	    "Foreword": ['hasAuthors', 'englishTitle', 'journalTitle', 'year', 'localLink'],
	    "Journal_Editorial": ['hasAuthors', 'englishTitle', 'journalTitle', 'year', 'localLink'],
	    'Magazine_Editorial': ['hasAuthors', 'englishTitle', 'journalTitle', 'year', 'localLink'],
	    'Other_Journal': ['hasAuthors', 'englishTitle', 'journalTitle', 'year', 'localLink'],
		},
		"Magazine": {
	    'ERCIM_News': ['hasAuthors', 'englishTitle', 'journalTitle', 'year', 'localLink']
		},
  },
  "Other": {
    "FORTH_ICS_Tech_Report": ['hasAuthors', 'englishTitle', 'year', 'reportNumber', 'localLink'],
    "Other_Tech_Report": ['hasAuthors', 'englishTitle', 'year'],
		"Thesis": {
			"Master_Thesis": ['hasAuthors', 'greekTitle', 'englishTitle', 'year', 'greekAbstract', 'englishAbstract', 'hasSupervisors'],
	    "Phd_Thesis": ['hasAuthors', 'greekTitle', 'englishTitle', 'year', 'greekAbstract', 'englishAbstract', 'hasSupervisors'],
		},
		"Event": {
			"Talk": ['hasAuthors', 'englishTitle', 'year', 'eventTitle', 'eventLocation', 'localLink'],
	    "Seminar": ['hasAuthors', 'englishTitle', 'year', 'eventTitle', 'eventLocation'],
			"Distinguished_Lecture": ['hasAuthors', 'englishTitle', 'year'],
		},
    "Multimedia_Material": ['hasAuthors', 'englishTitle', 'year', 'externalLink'],
    "White_Paper": ['hasAuthors', 'englishTitle', 'year'],
    "Miscellaneous": ['hasAuthors', 'englishTitle', 'year']
  }
}

//Order of Contributor types for each Category
var JSONContributorOrder= {
    "Paper_In_Proceedings_Full_Paper_Reviewed": ['hasAuthors', 'hasBookEditors'],
    "Paper_In_Proceedings_Abstract_Reviewed": ['hasAuthors', 'hasBookEditors'],
    "Poster_In_Proceedings_Full_Paper_Reviewed": ['hasAuthors', 'hasBookEditors'],
    "Poster_In_Proceedings_Abstract_Reviewed": ['hasAuthors', 'hasBookEditors'],
    "Demo": ['hasAuthors', 'hasBookEditors'],
    "Tutorial": ['hasAuthors', 'hasBookEditors'],
    "Edited_Proceeding": ['hasBookEditors'],
    "Invited_Paper": ['hasAuthors', 'hasBookEditors'],

    "Chapter_In_Book": ['hasChapterAuthors', 'hasBookEditors'],
    "Editor": ['hasAuthors', 'hasBookEditors'],
    "Whole_Book": ['hasAuthors', 'hasBookEditors'],
    "Monograph": ['hasAuthors', 'hasBookEditors'],

    'Journal_Article': ['hasAuthors'],
    'Scientific_Newsletter': ['hasAuthors'],
    "Foreword": ['hasAuthors'],
    "Journal_Editorial": ['hasAuthors'],
    'Magazine_Editorial': ['hasAuthors'],
    'Other_Journal': ['hasAuthors'],
    'ERCIM_News': ['hasAuthors'],

    "FORTH_ICS_Tech_Report": ['hasAuthors'],
    "Other_Tech_Report": ['hasAuthors'],
		"Distinguished_Lecture": ['hasAuthors'],
    "Talk": ['hasAuthors'],
    "Master_Thesis": ['hasAuthors', 'hasSupervisors'],
    "Phd_Thesis": ['hasAuthors', 'hasSupervisors'],
    "Seminar": ['hasAuthors'],
    "Multimedia_Material": ['hasAuthors'],
    "White_Paper": ['hasAuthors'],
    "Miscellaneous": ['hasAuthors'],
};

//The default title of each category
var titleFields = {
  "Conference_Workshop": {
    "Paper_In_Proceedings_Full_Paper_Reviewed": 'englishTitle',
    "Paper_In_Proceedings_Abstract_Reviewed": 'englishTitle',
    "Poster_In_Proceedings_Full_Paper_Reviewed": 'englishTitle',
    "Poster_In_Proceedings_Abstract_Reviewed": 'englishTitle',
    "Demo": 'englishTitle',
    "Tutorial": 'englishTitle',
    "Edited_Proceeding": 'bookTitle',
    "Invited_Paper": 'englishTitle'
  },
  "Book": {
    "Chapter_In_Book": 'chapterTitle',
    "Editor": 'bookTitle',
    "Whole_Book": 'bookTitle',
    "Monograph": 'bookTitle'
  },
  "Journal": {
    'Journal_Article': 'englishTitle',
    'Scientific_Newsletter': 'englishTitle',
    "Foreword": 'englishTitle',
    "Journal_Editorial": 'englishTitle',
    'Magazine_Editorial': 'englishTitle',
    'Other_Journal': 'englishTitle',
    'ERCIM_News': 'englishTitle'
  },
  "Other": {
    "FORTH_ICS_Tech_Report": 'englishTitle',
    "Other_Tech_Report": 'englishTitle',
		"Distinguished_Lecture": 'englishTitle',
    "Talk": 'englishTitle',
    "Master_Thesis": 'englishTitle',
    "Phd_Thesis": 'englishTitle',
    "Seminar": 'englishTitle',
    "Multimedia_Material": 'englishTitle',
    "White_Paper": 'englishTitle',
    "Miscellaneous": 'englishTitle',
  }
}

//DOI Category to PRESS Convertion
var doiCategoriesToPRESS = {
  'book-section':['Book', 'Chapter_In_Book'],
  'monograph': ['Book', 'Monograph'],
  'report': ['Other', 'Other_Tech_Report'],
  'journal-article': ['Journal', 'Journal_Article'],
  'book-part': ['Book', 'Chapter_In_Book'],
  'other': ['Other', 'Miscellaneous'],
  'book': ['Book', 'Whole_Book'],
  'proceedings-article': ['Conference_Workshop', 'Paper_In_Proceedings_Full_Paper_Reviewed'],
  'book-chapter': ['Book', 'Chapter_In_Book'],
  'report-series': ['Other', 'Other_Tech_Report'],
  'proceedings': ['Conference_Workshop', 'Paper_In_Proceedings_Full_Paper_Reviewed'],
  'journal-issue': ['Journal', 'Other_Journal'],
  'book-series': ['Book', 'Whole_Book'],
  'edited-book': ['Book', 'Editor'],
  'journal': ['Journal', 'Other_Journal']
}

//Convertion of DOI String data to PRESS Data
var doiFieldsToPRESS = {
  'DOI': 'doi',
  'page': 'pages',
  'publisher': 'publisher',
  'publisher-location': 'publisherLocation',
  //'URL': 'external',
  'abstract': 'englishAbstract',
  'volume': 'volume'
}

//Object Properties of the Ontology
var objectProperties = {
	author: "hasAuthors",
	chapterAuthor: "hasChapterAuthors",
	supervisor: "hasSupervisors",
	bookEditor: "hasBookEditors",
	project: "belongsTo",
	lab: "belongsTo"
};

//Person Field Labels
var personFields = {
	'hasAuthors': 'Authors',
	'hasChapterAuthors': 'Chapter Authors',
	'hasSupervisors': 'Supervisors',
	'hasBookEditors': 'Book Editors'
};

var filterFields = {
	hasContributors: {
		intro: '?filterCon rdfs:subPropertyOf* press:hasContributors. \n'
	},
	tags: {
		p: 'press:tag'
	},
	year: {
		p: 'press:year'
	},
	org: {
		p: 'press:belongsTo'
	},
	category: {
		p: 'rdf:type'
	},
}

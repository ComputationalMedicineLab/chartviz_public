ChartViz
========

A chart visualization / summarization prototype.

The app is composed of a Django Rest Framework API, a react frontend, and a
postgres db all running in docker containers. The prototype requires some data
files in order to run. The files located in `backend/initial_data/resources/`
provide some data files and headers for each data file needed. The files
`codes/chapters.csv`, `codes/icds.csv`, and `codes/phecodes.csv` contain a
taxonomy of ICD9 billing codes organized into chapters and related to more
clinically oriented phecodes; this taxonomy is used throughout the frontend to
organize and display patient information. All other files in
`backend/initial_data/resources` are stubs with CSV headers which will need to
be supplied by potential users with information appropriate to their
institution.

Additionally, a file `backend/taxonomies/resources/icdmedlab_embedding.gen`
will need to be supplied, which is a `gensim.models.word2vec.Word2Vec` model
relating ICD codes, labs, and medications. Vocabulary RE's are in
`backend/taxonomies/embedding.py`. This model is required, but until a model
can be trained on OMOP or other standardized data, it will need to be generated
per institution using an institution-appropriate vocabulary and dataset.

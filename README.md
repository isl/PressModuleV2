# PRESS Forth Version
### Publication REpository Semantic System

Publication management systems can be instrumental in disseminating research results across academia and industry, by providing facilities for uploading, editing and searching for publications. Usually, these systems can be used by individuals to assist them in their research or by organizations to help them classify and promote their publication items.

**PRESS** is an open-source publication system that exploits semantic technologies in order to cover the needs of both individuals and organizations. Thus, it supports fast data entry, advanced query capabilities and integration with other systems or datasets.

#### Module Installation

* Install [Drupal 7](https://www.drupal.org/docs/7/install)
* Install and enable the following modules
  * [jQuery Update](https://www.drupal.org/project/jquery_update)
    * Enable for jQuery 1.10
  * [Entity API](https://www.drupal.org/project/entity)
  * [Universally Unique IDentifier](https://www.drupal.org/project/uuid)
  * [Pathauto](https://www.drupal.org/project/pathauto)
  * [Token](https://www.drupal.org/project/token)
* Copy Drupal Module contents folder (sites/all/modules/publication_mod) in folder "sites/all/modules/"
* Enable PRESS Organization Field & PRESS Publication Module
* In case not all menus appear, please clear all caches from "[yourwebsite]/admin/config/development/performance"

#### Module Configuration

* When you enable for the first time the PRESS Publication Module, it adds three fields for the user account and one user role called "Power User"
  * You have to be a Power User to add a Publication without being a contributor. The module assigns automatically the admin as Power User
  * You will also have to fill the above fields for your account in order to use the module.
* Go at "[yourwebsite]/admin/config/publications/publication_mod"
  * Add Blazegraph REST API URL
  * Add the Ontology Prefix